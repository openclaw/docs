---
read_when:
    - Se desea que los agentes soliciten secretos seleccionados de 1Password
    - Se necesita una política de aprobación por secreto y un historial de auditoría
    - Se está configurando una cuenta de servicio de 1Password para OpenClaw
summary: Usa el plugin opcional de 1Password como intermediario auditado de secretos para agentes
title: Intermediario de secretos de 1Password
x-i18n:
    generated_at: "2026-07-14T13:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 0b199fcb582739dff5d0f7583482ced8e30dfc7e20b62b984391ad7bb92f67e1
    source_path: plugins/onepassword.md
    workflow: 16
---

# Intermediario de secretos de 1Password

El plugin `onepassword` incluido proporciona a los agentes una herramienta controlada por políticas para
leer un conjunto seleccionado de campos de 1Password. Está deshabilitado de forma predeterminada y no hace
nada hasta que `plugins.entries.onepassword.config` esté presente.

Esta es una herramienta para agentes, no un proveedor SecretRef. No inyecta variables de
entorno ni resuelve secretos de configuración de OpenClaw.

## Modelo de seguridad

- Solo autenticación mediante cuenta de servicio. El token permanece en un archivo local de credenciales
  y nunca se acepta en `openclaw.json`.
- Solo un registro seleccionado. Los agentes pueden enumerar los slugs configurados, pero el plugin nunca
  enumera una bóveda de 1Password.
- Política `auto`, `approve` o `deny` por slug.
- Las concesiones de aprobación caducan. Un valor almacenado en caché nunca elude la política vigente.
- Cada intento de acceso se registra en el estado SQLite compartido de OpenClaw. Las filas de auditoría
  incluyen el motivo proporcionado; los motivos no deben contener información confidencial. El intermediario
  nunca copia un valor obtenido ni el token de servicio en una fila de auditoría.
- Después de la ejecución actual de la herramienta, la persistencia de transcripciones gestionada por OpenClaw
  sustituye un valor `get` obtenido correctamente por metadatos censurados.
- El valor es visible para el modelo durante esa ejecución. Si el modelo lo copia en una
  llamada posterior a una herramienta o en una respuesta, ese registro independiente queda fuera del
  mecanismo de persistencia de este plugin. Mantenga las políticas restrictivas y no pida al modelo que repita un
  valor.
- El plugin invoca `op` una vez por cada fallo de caché. No reintenta tras límites de frecuencia ni
  otros fallos.

Conceda a la cuenta de servicio acceso de lectura únicamente a las bóvedas y los elementos registrados en
la configuración del plugin.

## Antes de comenzar

Se necesita:

- la CLI de 1Password (`op`) instalada en el host del Gateway
- una cuenta de servicio de 1Password con acceso a los elementos seleccionados
- un archivo de token dedicado para la cuenta de servicio

Habilite el plugin incluido:

```bash
openclaw plugins enable onepassword
```

Cree el directorio y el archivo del token dentro del directorio de estado de OpenClaw:

```bash
mkdir -p ~/.openclaw/credentials/onepassword
chmod 700 ~/.openclaw/credentials/onepassword
printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN" > \
  ~/.openclaw/credentials/onepassword/service-account-token
chmod 600 ~/.openclaw/credentials/onepassword/service-account-token
unset OP_SERVICE_ACCOUNT_TOKEN
```

Cuando `OPENCLAW_STATE_DIR` esté definido, sustituya `~/.openclaw` por ese directorio.
El plugin advierte una vez cuando el archivo del token permite la lectura o escritura al grupo o a
otros usuarios.

## Configurar los secretos registrados

Añada la configuración del plugin a `openclaw.json`:

```jsonc
{
  "plugins": {
    "entries": {
      "onepassword": {
        "enabled": true,
        "config": {
          "vault": "Automation",
          "defaultPolicy": "approve",
          "cacheTtlSeconds": 300,
          "grantTtlHours": 720,
          "opTimeoutMs": 15000,
          "items": {
            "repository-token": {
              "item": "Repository automation token",
              "field": "credential",
              "policy": "approve",
              "description": "Token for repository automation",
            },
            "model-key": {
              "item": "Model provider key",
              "vault": "Agent credentials",
              "policy": "auto",
            },
          },
        },
      },
    },
  },
}
```

Los slugs usan letras minúsculas, números y guiones, comienzan con una letra o un
número y contienen como máximo 64 caracteres. Un registro puede contener hasta 32
slugs; las descripciones pueden contener hasta 200 caracteres. `field` acepta una etiqueta
o un ID de campo, no debe contener comas y su valor predeterminado es `credential`.
Un valor `vault` a nivel de elemento sustituye la bóveda predeterminada. `opBin` puede definir una ruta
absoluta al ejecutable `op`; de lo contrario, el plugin resuelve `op` desde `PATH`.
Los títulos de los elementos no deben comenzar con un guion.

## Usar la herramienta del agente

El nombre de la herramienta es `onepassword`.

Enumere los slugs registrados:

```json
{ "action": "list" }
```

El resultado contiene únicamente el slug, la descripción, la política y si hay una concesión
permanente activa. Nunca contiene un valor secreto ni consulta 1Password.

Solicite un secreto:

```json
{
  "action": "get",
  "slug": "repository-token",
  "reason": "Authenticate the requested repository operation"
}
```

`reason` es obligatorio, no debe estar vacío y está limitado a 300 caracteres. Una operación
`get` correcta devuelve el valor junto con el slug configurado, el título del elemento y la
etiqueta del campo.

## Niveles de política y aprobaciones

- `auto`: obtiene el valor inmediatamente y audita la solicitud.
- `deny`: bloquea y audita la solicitud.
- `approve`: utiliza una concesión permanente que no haya caducado o solicita a una persona que permita una vez,
  permita siempre o deniegue.

Permitir una vez autoriza únicamente la llamada actual a la herramienta. Permitir siempre escribe una concesión
permanente para ese agente y slug en SQLite; los demás agentes deben obtener su propia
aprobación. OpenClaw solo ofrece permitir siempre cuando el invocador tiene una identidad de agente
concreta. La concesión caduca después de `grantTtlHours`, cuyo valor predeterminado es 720 horas.
Una aprobación no resuelta o que agote el tiempo de espera deniega la solicitud; el tiempo máximo de espera de
aprobación es de 600 segundos. El plugin conserva hasta 1.024 concesiones permanentes; al alcanzar ese
límite, se expulsa la concesión más antigua y su agente debe aprobar el siguiente acceso.

La caché en memoria tiene un valor predeterminado de 300 segundos y está limitada por el registro de
slugs configurado. Establezca `cacheTtlSeconds` en `0` para deshabilitarla. La política se evalúa
antes de cada consulta de caché y los aciertos de caché se auditan. Las recargas de la configuración en tiempo de ejecución
surten efecto en cada límite de política y ejecución; deshabilitar el plugin o
eliminar, denegar o cambiar el destino de un slug invalida las autorizaciones pendientes y
los valores almacenados en caché.

## Consultar el estado y el historial de auditoría

Muestre la disponibilidad y los recuentos del registro:

```bash
openclaw onepassword status
```

Esto indica si existe el archivo del token, si `op` se resolvió y cuál es su ruta,
el número de elementos registrados y los recuentos por política. Nunca lee ni muestra el
token ni los valores secretos.

Muestre las 50 filas de auditoría más recientes:

```bash
openclaw onepassword audit
openclaw onepassword audit --limit 100
```

Las filas se muestran primero de la más reciente a la más antigua e indican la marca de tiempo, el agente, el slug, el resultado y un
motivo truncado. El motivo se almacena tal como se proporciona; el intermediario nunca añade el valor
obtenido al registro de auditoría.

## Comportamiento de la CLI de 1Password

Cada fallo de caché ejecuta `op item get` con el elemento y la bóveda configurados, el selector
exacto del campo, salida JSON, un tiempo de espera limitado y `--cache=false`. El proceso secundario
recibe únicamente ese campo, no el elemento completo. Solo
`OP_SERVICE_ACCOUNT_TOKEN` y `HOME` están presentes en el entorno del proceso secundario.

El plugin realiza un solo intento. Los errores `RATE_LIMITED` deben gestionarse esperando
antes de una solicitud posterior del agente; el plugin no crea un bucle automático de
reintentos. Otros códigos de error estables distinguen entre tokens o binarios ausentes, elementos
o campos ausentes, fallos de autenticación, tiempos de espera agotados y otros fallos de `op`.
