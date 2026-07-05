---
read_when:
    - Ejecución del QA de escritorio de Mantis Slack desde GitHub o localmente
    - Depuración de ejecuciones lentas de Mantis en Slack de escritorio
    - Elegir el modo de código fuente, prehidratado o de arrendamiento en caliente
    - Publicar evidencia de capturas de pantalla y video en un PR
summary: 'Manual operativo para la QA de escritorio de Mantis Slack: despacho de GitHub, CLI local, concesiones VNC activas, modos de hidratación, interpretación de tiempos, artefactos y gestión de fallos.'
title: Mantis Slack runbook de escritorio
x-i18n:
    generated_at: "2026-07-05T11:14:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA es la vía de interfaz real para errores de clase Slack que necesitan un
escritorio Linux, rescate por VNC, Slack Web, un Gateway real de OpenClaw, capturas de pantalla,
videos y un comentario de evidencia en el PR. Úsala cuando las pruebas unitarias o la vía live
sin interfaz de Slack no puedan demostrar el error.

## Modelo de almacenamiento

Mantis usa tres capas de almacenamiento:

- **Imagen del proveedor** - propiedad de Crabbox, almacenada en la cuenta del proveedor de nube.
  Contiene las capacidades de la máquina (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, herramientas de compilación nativas) y directorios de caché vacíos.
- **Estado de arrendamiento cálido** - propiedad de la sesión actual del operador. Puede contener un
  perfil de navegador con sesión iniciada, `/var/cache/crabbox/pnpm` y un checkout de código fuente
  preparado mientras el arrendamiento esté activo.
- **Artefactos de Mantis** - propiedad de la ejecución de OpenClaw. Viven en
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions los sube y la GitHub App de Mantis
  comenta evidencia en línea en el PR.

Nunca incorpores secretos, cookies del navegador, estado de inicio de sesión de Slack, checkouts de repositorio,
`node_modules` ni `dist/` en una imagen de proveedor.

## Despacho de GitHub

Ejecuta el workflow desde `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

`candidate_ref` está restringido porque el workflow usa credenciales live: debe
resolverse a la ascendencia actual de `main`, a una etiqueta de release o al head de un PR abierto en
`openclaw/openclaw`.

El workflow produce:

- artefacto subido `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- comentario en línea del PR desde la GitHub App de Mantis
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- logs remotos: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

El comentario del PR se actualiza en el mismo lugar mediante el marcador oculto `<!-- mantis-slack-desktop-smoke -->`.

## CLI local

Prueba de fuente fría:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

Conserva la VM para rescate por VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Abrir VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Reutilizar un arrendamiento cálido:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Usa `--hydrate-mode prehydrated` solo cuando el espacio de trabajo remoto reutilizado ya
tenga `node_modules` y un `dist/` compilado; de lo contrario, Mantis falla de forma cerrada.

Demostrar la interfaz de aprobación nativa de Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` es mutuamente excluyente con `--gateway-setup`. Ejecuta
los escenarios opcionales `slack-approval-exec-native` y `slack-approval-plugin-native`
a menos que pases un `--scenario` de approval-checkpoint explícito; otros
escenarios de Slack se rechazan antes de que arranque la VM. El ejecutor de Slack QA escribe
cada archivo JSON de checkpoint desde el mensaje real de la API de Slack que observó, y luego
el observador remoto renderiza ese mensaje en
`approval-checkpoints/<scenario>-pending.png` y
`approval-checkpoints/<scenario>-resolved.png`. La ejecución falla si falta o está vacío
cualquier JSON de checkpoint, evidencia de mensaje, JSON de confirmación o captura renderizada.

Los arrendamientos fríos de GitHub Actions no tienen cookies de Slack Web, así que su captura del navegador
puede terminar en la pantalla de inicio de sesión de Slack. Para pruebas de approval-checkpoint, confía en las
imágenes de checkpoint renderizadas y los artefactos de Slack QA en lugar de
`slack-desktop-smoke.png`. Usa un arrendamiento cálido conservado con un perfil de Slack Web
con sesión iniciada manualmente solo cuando la captura del navegador en sí deba mostrar
Slack Web.

## Modos de hidratación

| Modo          | Úsalo cuando                              | Comportamiento remoto                                                                  | Compensación                                             |
| ------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Prueba normal de PR, máquinas frías, CI   | Ejecuta `pnpm install --frozen-lockfile --prefer-offline` y `pnpm build` dentro de la VM | La opción más lenta y con la prueba de checkout de fuente más sólida |
| `prehydrated` | Preparaste intencionalmente un arrendamiento reutilizado | Requiere `node_modules` y `dist/` existentes; omite instalación/compilación             | Rápido, pero solo válido para arrendamientos cálidos controlados por el operador |

GitHub Actions siempre prepara el checkout candidato antes de la ejecución de la VM. Su
almacén de pnpm se cachea por SO, versión de Node y lockfile. La ejecución `source` de la VM
también reutiliza `/var/cache/crabbox/pnpm` cuando está presente.

## Interpretación de tiempos

`mantis-slack-desktop-smoke-report.md` incluye tiempos por fase:

- `crabbox.warmup` - arranque del proveedor de nube, preparación de escritorio/navegador, SSH.
- `crabbox.inspect` - consulta de metadatos del arrendamiento.
- `credentials.prepare` - adquisición del arrendamiento de credenciales de Convex.
- `crabbox.remote_run` - sincronización, lanzamiento del navegador, instalación/compilación de OpenClaw o
  validación de hidratación, arranque del Gateway, captura de pantalla y captura de video.
- `artifacts.copy` - rsync de vuelta desde la VM.

`crabbox.remote_run` puede mostrar `accepted` cuando Crabbox devuelve un estado remoto
distinto de cero, pero Mantis copió metadatos que prueban que la configuración del Gateway de OpenClaw
se completó o que el propio comando de Slack QA salió correctamente. Trata
`accepted` como aprobado con explicación, no como un escenario fallido.

Si una ejecución es lenta:

- Domina el calentamiento: prehornea o promueve una mejor imagen de proveedor de Crabbox.
- `remote_run` domina en `source`: usa un arrendamiento cálido, mejora la reutilización del almacén de pnpm
  o mueve los prerrequisitos de la máquina a la imagen del proveedor.
- `remote_run` domina en `prehydrated`: el espacio de trabajo remoto no estaba
  realmente listo, o la configuración de Gateway/navegador/Slack es lenta.
- Domina la copia de artefactos: inspecciona el tamaño del video y el contenido del directorio de artefactos.

## Lista de verificación de evidencia

Un buen comentario de PR muestra:

- id de escenario y SHA candidato
- URL de ejecución de GitHub Actions y URL de artefacto
- captura de approval-checkpoint en línea, o una captura de Slack Web desde un
  arrendamiento cálido con sesión iniciada
- vista previa animada en línea cuando esté disponible
- enlaces al MP4 completo y al MP4 recortado
- estado aprobado/fallido y el resumen de tiempos del informe

No confirmes capturas de pantalla ni videos en el repositorio. Manténlos en los
artefactos de GitHub Actions o en el comentario del PR.

## Manejo de fallos

Si el workflow falla antes de la ejecución de la VM, inspecciona primero el job de Actions.
Causas típicas: `candidate_ref` no confiable, secretos de entorno faltantes o un
fallo de instalación/compilación del candidato.

Si la ejecución de la VM falla pero las capturas se copiaron de vuelta, inspecciona:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Si la ejecución conservó el arrendamiento, abre VNC con el comando `crabbox vnc ...`
del informe y luego detén el arrendamiento cuando termines:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Si el inicio de sesión de Slack expiró, repáralo en VNC en un arrendamiento conservado y vuelve a ejecutar con
`--lease-id`. No incorpores ese perfil de navegador en una imagen de proveedor.

## Relacionado

- [Resumen de QA](/es/concepts/qa-e2e-automation)
- [Canal Slack](/es/channels/slack)
- [Pruebas](/es/help/testing)
