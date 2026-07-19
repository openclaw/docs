---
read_when:
    - Quiere que los agentes soliciten secretos seleccionados de 1Password
    - Se necesita una política de aprobación por secreto y un historial de auditoría.
    - Está configurando una cuenta de servicio de 1Password para OpenClaw
summary: Usa el plugin opcional de 1Password como intermediario auditado de secretos para agentes
title: Intermediario de secretos de 1Password
x-i18n:
    generated_at: "2026-07-19T02:16:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 255ab4fd2c63754fef29d3ea87dcedc9ca2bd2f34bec1f81139e2ce5b6acdba2
    source_path: plugins/onepassword.md
    workflow: 16
---

# Intermediario de secretos de 1Password

El plugin incluido `onepassword` proporciona a los agentes una herramienta controlada por políticas para
leer un conjunto seleccionado de campos de 1Password. Está deshabilitado de forma predeterminada y no hace
nada hasta que `plugins.entries.onepassword.config` esté presente.

Esta es una herramienta de agente, no un proveedor de SecretRef. No inyecta variables
de entorno ni resuelve secretos de configuración de OpenClaw.

## Modelo de seguridad

- Solo autenticación mediante cuenta de servicio. El token permanece en un archivo local de credenciales
  y nunca se acepta en `openclaw.json`.
- Solo registro seleccionado. Los agentes pueden enumerar los slugs configurados, pero el plugin nunca
  enumera una bóveda de 1Password.
- Política por slug `auto`, `approve` o `deny`.
- Las concesiones de aprobación caducan. Un valor almacenado en caché nunca elude la política vigente.
- Cada intento de acceso se registra en el estado SQLite compartido de OpenClaw. Las filas de auditoría
  incluyen el motivo proporcionado; los motivos no deben contener información confidencial. El intermediario
  nunca copia un valor obtenido ni el token de servicio en una fila de auditoría.
- Después de la ejecución actual de la herramienta, la persistencia de transcripciones propiedad de OpenClaw
  sustituye un valor `get` obtenido correctamente por metadatos censurados.
- El valor es visible para el modelo durante esa ejecución. Si el modelo lo copia en una
  llamada posterior a una herramienta o en una respuesta, ese registro independiente queda fuera del enlace de persistencia
  de este plugin. Mantenga las políticas restringidas y no solicite al modelo que repita un
  valor.
- El plugin invoca `op` una vez por cada fallo de caché. No reintenta tras límites de frecuencia ni
  otros fallos.
- Cada llamada a `op` se ejecuta con un entorno mínimo que deshabilita la integración con la aplicación
  de escritorio de 1Password (`OP_LOAD_DESKTOP_APP_SETTINGS=false`,
  `OP_BIOMETRIC_UNLOCK_ENABLED=false`), para que una aplicación de 1Password instalada en el
  host del Gateway nunca active diálogos biométricos ni de permisos de macOS.

Conceda a la cuenta de servicio acceso de lectura únicamente a las bóvedas y los elementos registrados en
la configuración del plugin.

## Antes de comenzar

Se necesita:

- la CLI de 1Password (`op`) instalada en el host del Gateway
- una cuenta de servicio de 1Password con acceso a los elementos seleccionados
- un archivo dedicado para el token de la cuenta de servicio

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

Cuando `OPENCLAW_STATE_DIR` esté establecido, sustituya `~/.openclaw` por ese directorio.
El plugin muestra una advertencia una vez cuando el archivo del token puede ser leído o escrito por el grupo u
otros usuarios.

## Configurar secretos registrados

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
Un `vault` a nivel de elemento sustituye la bóveda predeterminada. `opBin` puede establecer una ruta
absoluta al ejecutable `op`; de lo contrario, el plugin resuelve `op` desde `PATH`.
Los títulos de los elementos no deben comenzar con un guion.

## Usar la herramienta de agente

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

`reason` es obligatorio, no debe estar vacío y está limitado a 300 caracteres. Una
operación `get` correcta devuelve el valor junto con el slug configurado, el título del elemento y la
etiqueta del campo.

El esquema de la herramienta también declara un parámetro interno `authorizationNonce`. La
capa de políticas lo inyecta después de evaluar la solicitud para transferir la autorización
a la llamada de herramienta que la ejecuta. Nunca lo establezca manualmente: el enlace de políticas sobrescribe
cualquier valor proporcionado y un valor desconocido hace que la solicitud falle.

## Niveles de políticas y aprobaciones

- `auto`: obtiene el valor inmediatamente y audita la solicitud.
- `deny`: bloquea y audita la solicitud.
- `approve`: usa una concesión permanente que no haya caducado o solicita a una persona que permita una vez,
  permita siempre o deniegue.

Permitir una vez autoriza únicamente la llamada de herramienta actual. Permitir siempre escribe una concesión
permanente para ese agente y slug en SQLite; los demás agentes deben obtener su propia
aprobación. OpenClaw solo ofrece permitir siempre cuando el autor de la llamada tiene una identidad de agente
concreta. La concesión caduca después de `grantTtlHours`, cuyo valor predeterminado es 720 horas.
Una aprobación sin resolver o que supere el tiempo de espera deniega la solicitud; el tiempo máximo de espera de
aprobación es de 600 segundos. El plugin conserva hasta 1.024 concesiones permanentes; al alcanzar ese
límite, se expulsa la concesión más antigua y su agente debe aprobar el siguiente acceso.

Cada autorización evaluada es de un solo uso y se transfiere a la llamada de herramienta
que la ejecuta mediante el estado SQLite compartido, por lo que la transferencia también funciona cuando hay más de una
instancia del plugin activa en el proceso del Gateway. Las autorizaciones sin usar caducan
después del periodo de aprobación de 600 segundos.

El valor predeterminado de la caché en memoria es de 300 segundos y su tamaño está limitado por el registro de
slugs configurado. Establezca `cacheTtlSeconds` en `0` para deshabilitarla. La política se evalúa
antes de cada consulta de la caché y los aciertos de caché se auditan. Las recargas de la configuración en tiempo de ejecución
surten efecto en cada límite de política y ejecución; deshabilitar el plugin o
eliminar, denegar o cambiar el destino de un slug invalida las autorizaciones pendientes y
los valores almacenados en caché.

## Consultar el estado y el historial de auditoría

Muestre la disponibilidad y los recuentos del registro:

```bash
openclaw onepassword status
```

Esto informa si existe el archivo del token, si se resolvió `op` y cuál es su ruta,
el número de elementos registrados y los recuentos por política. Nunca lee ni muestra el
token ni los valores secretos.

Muestre las 50 filas de auditoría más recientes:

```bash
openclaw onepassword audit
openclaw onepassword audit --limit 100
```

Las filas se muestran de la más reciente a la más antigua e indican la marca de tiempo, el agente, el slug, el resultado, un `errorCode`
cuando el intento falló y un motivo truncado. El motivo se almacena tal como se
proporcionó; el intermediario nunca añade el valor obtenido al registro de auditoría.

## Comportamiento de la CLI de 1Password

Cada fallo de caché ejecuta `op item get` con el elemento y la bóveda configurados, el selector de
campo exacto, salida JSON, un tiempo de espera limitado y `--cache=false`. El proceso secundario
recibe únicamente ese campo en lugar del elemento completo. Solo
`OP_SERVICE_ACCOUNT_TOKEN` y `HOME` están presentes en el entorno del proceso secundario.

El plugin realiza un solo intento. Los errores `RATE_LIMITED` deben gestionarse esperando
antes de realizar una solicitud posterior del agente; el plugin no crea un bucle automático de
reintentos.

## Códigos de error

Los intentos fallidos incluyen un código de error cerrado en el resultado de la herramienta y en la fila de
auditoría.

Errores de acceso a 1Password:

| Código              | Significado                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `TOKEN_MISSING`   | El archivo del token no existe o está vacío                                   |
| `OP_NOT_FOUND`    | No se pudo resolver el binario `op`                                |
| `ITEM_NOT_FOUND`  | El elemento configurado no está en la bóveda                              |
| `FIELD_NOT_FOUND` | El campo configurado no está en el elemento; se enumeran las etiquetas disponibles |
| `RATE_LIMITED`    | Se alcanzó el límite de frecuencia de la cuenta de servicio de 1Password                     |
| `AUTH_FAILED`     | Falló la autenticación de la cuenta de servicio                            |
| `TIMEOUT`         | `op` superó `opTimeoutMs`                                      |
| `OP_ERROR`        | Cualquier otro fallo de `op` o salida no válida                         |

Errores de políticas y validación:

| Código                                               | Significado                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `INVALID_ACTION`, `INVALID_REASON`, `INVALID_SLUG` | La solicitud no superó la validación de entrada                                              |
| `UNKNOWN_SLUG`                                     | El slug no está en el registro configurado                                       |
| `TOOL_CALL_ID_MISSING`                             | La llamada llegó sin un ID de llamada de herramienta                                          |
| `POLICY_NOT_EVALUATED`                             | No hay una autorización coincidente para esta llamada; la solicitud no fue aprobada por la política |
| `POLICY_CHANGED`                                   | La configuración cambió entre la aprobación y la ejecución                                |
| `GRANT_EXPIRED`                                    | La concesión permanente caducó antes de la ejecución                                       |
| `APPROVAL_CANCELLED`                               | La ejecución se canceló mientras la aprobación estaba pendiente                           |
