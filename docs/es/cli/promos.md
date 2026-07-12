---
read_when:
    - Quieres probar una oferta promocional gratuita de un modelo de ClawHub
    - Estás configurando un proveedor mediante una promoción en lugar de la incorporación.
summary: Referencia de la CLI para `openclaw promos` (listar y reclamar ofertas promocionales de modelos)
title: Promociones
x-i18n:
    generated_at: "2026-07-11T23:01:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Descubre y reclama ofertas promocionales de modelos publicadas en ClawHub. Al reclamar una promoción, se configura el proveedor (la autenticación y el plugin, cuando sea necesario) y se registran los modelos de la promoción, sin volver a ejecutar la incorporación y sin cambiar tu modelo predeterminado, a menos que así lo indiques.

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

Enumera las promociones activas actualmente, junto con sus modelos, el modelo predeterminado sugerido, el tiempo restante y el comando exacto para reclamarlas. `--json` imprime la carga útil sin procesar.

## `openclaw promos claim <slug>`

Reclama una promoción activa:

1. Obtiene la promoción de ClawHub y verifica que esté dentro de su período de validez.
2. Valida el proveedor de la promoción, la opción de autenticación y los paquetes de plugins declarados con respecto a la versión de OpenClaw instalada. Los identificadores desconocidos o las discrepancias entre paquetes se rechazan: una promoción nunca puede hacer que la CLI ejecute algo que aún no sepa ejecutar.
3. Reutiliza las credenciales existentes del proveedor si las tienes. De lo contrario, te guía por el flujo de autenticación habitual del proveedor (primero muestra la URL de registro de la promoción para obtener una clave gratuita). `--api-key <key>` completa la autenticación mediante clave de API sin solicitudes interactivas, de forma equivalente a las opciones no interactivas de `openclaw onboard`; para evitar incluir la clave en la línea de comandos, exporta en su lugar la variable de entorno del proveedor (por ejemplo, `OPENROUTER_API_KEY`). Las credenciales existentes en el entorno se detectan automáticamente y no se necesita ninguna opción.
4. Registra los modelos de la promoción con sus alias. Los alias existentes nunca se sobrescriben.
5. Ofrece establecer el modelo sugerido por la promoción como predeterminado. `--set-default` omite la pregunta; de lo contrario, no se modifica ninguna configuración predeterminada.

Cuando finaliza el período de la promoción, el proveedor deja de ofrecer los modelos gratuitos; tu configuración y tus credenciales no se modifican. Puedes cambiar de modelo en cualquier momento con `openclaw models set <model>`.

## Descubrimiento pasivo en `models list`

`openclaw models list` también muestra promociones sin que consultes ClawHub directamente:

- Las ofertas activas cuyos modelos no hayas configurado aparecen en un grupo «Disponible mediante promoción» debajo de la tabla, cada una con su comando para reclamarla.
- Los modelos que registraste mediante `promos claim` incluyen una etiqueta `promo`, que cambia a `promo ended` cuando finaliza el período de la oferta.
- La primera vez que se detecta una nueva oferta, un aviso único señala `openclaw promos list`. Las ofertas que ya hayas enumerado o reclamado no vuelven a anunciarse.

Esto lee una copia almacenada en caché localmente del canal de promociones alojado en ClawHub (que normalmente se actualiza una vez al día mediante una solicitud condicional, o antes si vence la instantánea almacenada en caché; los errores de actualización se omiten silenciosamente). La actualización de una copia obsoleta espera como máximo 2,5 segundos y nunca interrumpe el listado. La salida de `--json` y `--plain` se mantiene apta para el procesamiento automático: no incluye secciones ni avisos de promociones. Al reclamar una oferta, siempre se vuelve a validar con la API activa de ClawHub, por lo que una oferta retirada antes de tiempo se rechaza aunque todavía aparezca en una copia almacenada en caché.
