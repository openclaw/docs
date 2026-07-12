---
read_when:
    - Quieres probar una oferta promocional de modelo gratuito de ClawHub
    - Está configurando un proveedor mediante una promoción en lugar de usar la incorporación
summary: Referencia de la CLI para `openclaw promos` (enumerar y reclamar ofertas promocionales de modelos)
title: Promociones
x-i18n:
    generated_at: "2026-07-12T14:26:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Descubra y reclame ofertas promocionales de modelos publicadas en ClawHub. Al reclamar una
promoción, se configura el proveedor (la autenticación y el Plugin, cuando sea necesario) y se registran
los modelos de la promoción, sin volver a ejecutar la incorporación y sin cambiar
su modelo predeterminado a menos que así lo indique.

Relacionado:

- Modelo predeterminado y alternativas: [Modelos](/es/cli/models)
- Configuración de la autenticación del proveedor: [Primeros pasos](/es/start/getting-started)

## Comandos

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Enumera las promociones que están activas actualmente, junto con sus modelos, el valor
predeterminado sugerido, el tiempo restante y el comando exacto para reclamarlas. `--json` imprime la carga
útil sin procesar.

## `openclaw promos claim <slug>`

Reclama una promoción activa:

1. Obtiene la promoción de ClawHub y verifica que esté dentro de su periodo de vigencia.
2. Valida el proveedor, la opción de autenticación y los paquetes de Plugin declarados de la promoción
   con respecto a su versión instalada de OpenClaw. Se rechazan los identificadores desconocidos o las discrepancias de
   paquetes: una promoción nunca puede hacer que la CLI ejecute algo que aún no
   sepa ejecutar.
3. Reutiliza las credenciales existentes del proveedor cuando están disponibles. De lo contrario,
   recorre el flujo de autenticación normal del proveedor (primero muestra la URL de registro de la promoción
   para obtener una clave gratuita). `--api-key <key>` completa la autenticación mediante clave de API sin
   solicitudes interactivas, de acuerdo con las opciones no interactivas de `openclaw onboard`; para mantener la
   clave fuera de la línea de comandos, exporte en su lugar la variable de entorno del proveedor
   (por ejemplo, `OPENROUTER_API_KEY`): las credenciales existentes en el entorno se
   detectan automáticamente y no se necesita ninguna opción.
4. Registra los modelos de la promoción con sus alias. Los alias existentes
   nunca se sobrescriben.
5. Ofrece establecer el modelo sugerido por la promoción como predeterminado:
   `--set-default` omite la pregunta; de lo contrario, no cambia nada de sus valores
   predeterminados.

Cuando termina el periodo de vigencia de la promoción, el proveedor deja de ofrecer los modelos gratuitos;
su configuración y sus credenciales permanecen intactas. Puede volver a cambiar en cualquier momento con
`openclaw models set <model>`.

## Detección pasiva en `models list`

`openclaw models list` también muestra promociones sin que tenga que consultar ClawHub
directamente:

- Las ofertas activas cuyos modelos no haya configurado aparecen en un grupo
  "Disponibles mediante promoción" debajo de la tabla, cada una con su comando para
  reclamarla.
- Los modelos que registró mediante `promos claim` llevan una etiqueta `promo`, que
  cambia a `promo ended` una vez finalizado el periodo de vigencia de la oferta.
- La primera vez que se detecta una oferta nueva, un aviso que aparece una sola vez remite a
  `openclaw promos list`. Las ofertas que ya haya enumerado o reclamado nunca
  vuelven a anunciarse.

Esto lee una copia almacenada en caché localmente del feed de promociones alojado en ClawHub
(que normalmente se actualiza una vez al día mediante una solicitud condicional, o antes cuando
caduca la instantánea almacenada en caché; los errores de actualización se omiten silenciosamente). Una actualización
de datos obsoletos espera como máximo 2.5 segundos y nunca interrumpe el listado. La salida de `--json` y
`--plain` se mantiene limpia para su procesamiento automático: no contiene secciones ni avisos de promociones.
Al reclamar, siempre se vuelve a validar con la API activa de ClawHub, por lo que se rechaza una oferta retirada
antes de tiempo aunque una copia almacenada en caché todavía la muestre.
