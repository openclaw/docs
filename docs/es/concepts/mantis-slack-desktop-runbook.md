---
read_when:
    - Ejecución del control de calidad de Mantis para Slack de escritorio desde GitHub o localmente
    - Depuración de ejecuciones lentas de Mantis en la aplicación de escritorio de Slack
    - Elegir el modo fuente, prehidratado o de arrendamiento activo
    - Publicar capturas de pantalla y pruebas en vídeo en una PR
summary: 'Manual operativo para el control de calidad de escritorio de Mantis en Slack: ejecución desde GitHub, CLI local, sesiones VNC precalentadas, modos de hidratación, interpretación de tiempos, artefactos y gestión de errores.'
title: Manual operativo de Mantis para la aplicación de escritorio de Slack
x-i18n:
    generated_at: "2026-07-11T23:03:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA es la vía de interfaz real para errores de tipo Slack que necesitan un
escritorio Linux, recuperación mediante VNC, Slack Web, un Gateway real de OpenClaw, capturas de pantalla,
vídeos y un comentario con evidencias en el PR. Úsala cuando las pruebas unitarias o la vía
en vivo sin interfaz de Slack no puedan demostrar el error.

## Modelo de almacenamiento

Mantis utiliza tres capas de almacenamiento:

- **Imagen del proveedor** - propiedad de Crabbox, almacenada en la cuenta del proveedor de nube.
  Contiene las capacidades de la máquina (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, herramientas de compilación nativas) y directorios de caché vacíos.
- **Estado de la concesión activa** - propiedad de la sesión actual del operador. Puede contener un
  perfil de navegador con sesión iniciada, `/var/cache/crabbox/pnpm` y un checkout preparado del código fuente
  mientras la concesión esté activa.
- **Artefactos de Mantis** - propiedad de la ejecución de OpenClaw. Se encuentran en
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions los sube y la aplicación de GitHub de Mantis
  comenta las evidencias insertadas en el PR.

Nunca incluyas secretos, cookies del navegador, el estado de inicio de sesión de Slack, checkouts del repositorio,
`node_modules` ni `dist/` en una imagen del proveedor.

## Ejecución mediante GitHub

Ejecuta el flujo de trabajo desde `main`:

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

`candidate_ref` está restringido porque el flujo de trabajo utiliza credenciales reales: debe
resolverse como parte del historial de la versión actual de `main`, una etiqueta de versión o la cabecera de un PR abierto en
`openclaw/openclaw`.

El flujo de trabajo produce:

- el artefacto subido `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- un comentario insertado en el PR por la aplicación de GitHub de Mantis
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- registros remotos: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

El comentario del PR se actualiza en el mismo lugar mediante el marcador oculto `<!-- mantis-slack-desktop-smoke -->`.

## CLI local

Comprobación en frío desde el código fuente:

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

Conserva la máquina virtual para recuperarla mediante VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Abre VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Reutiliza una concesión activa:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Usa `--hydrate-mode prehydrated` únicamente cuando el espacio de trabajo remoto reutilizado ya
tenga `node_modules` y un directorio `dist/` compilado; de lo contrario, Mantis falla de forma segura.

Demuestra la interfaz nativa de aprobación de Slack:

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
los escenarios opcionales `slack-approval-exec-native` y `slack-approval-plugin-native`,
salvo que pases un `--scenario` explícito de punto de control de aprobación; los demás
escenarios de Slack se rechazan antes de iniciar la máquina virtual. El ejecutor de QA de Slack escribe
cada archivo JSON del punto de control a partir del mensaje real de la API de Slack que observó y, a continuación,
el observador remoto representa ese mensaje en
`approval-checkpoints/<scenario>-pending.png` y
`approval-checkpoints/<scenario>-resolved.png`. La ejecución falla si algún
JSON de punto de control, evidencia del mensaje, JSON de confirmación o captura de pantalla representada falta
o está vacío.

Las concesiones en frío de GitHub Actions no tienen cookies de Slack Web, por lo que la captura del navegador
puede mostrar la pantalla de inicio de sesión de Slack. Para demostrar los puntos de control de aprobación, confía en las
imágenes generadas de los puntos de control y los artefactos de QA de Slack, en lugar de
`slack-desktop-smoke.png`. Usa una concesión activa conservada con un perfil de Slack Web
en el que se haya iniciado sesión manualmente únicamente cuando la propia captura del navegador deba mostrar
Slack Web.

## Modos de preparación

| Modo          | Cuándo usarlo                             | Comportamiento remoto                                                                  | Contrapartida                                             |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Comprobación normal de PR, máquinas en frío, CI | Ejecuta `pnpm install --frozen-lockfile --prefer-offline` y `pnpm build` dentro de la máquina virtual | Es el más lento, pero ofrece la comprobación más sólida del checkout del código fuente |
| `prehydrated` | Has preparado deliberadamente una concesión reutilizada | Requiere que ya existan `node_modules` y `dist/`; omite la instalación y la compilación | Es rápido, pero solo es válido para concesiones activas controladas por el operador |

GitHub Actions siempre prepara el checkout candidato antes de ejecutar la máquina virtual. Su
almacén de pnpm se guarda en caché según el sistema operativo, la versión de Node y el archivo de bloqueo. La ejecución de la máquina virtual en modo `source`
también reutiliza `/var/cache/crabbox/pnpm` cuando está disponible.

## Interpretación de los tiempos

`mantis-slack-desktop-smoke-report.md` incluye los tiempos de las fases:

- `crabbox.warmup` - arranque del proveedor de nube, disponibilidad del escritorio y el navegador, SSH.
- `crabbox.inspect` - consulta de los metadatos de la concesión.
- `credentials.prepare` - adquisición de la concesión de credenciales de Convex.
- `crabbox.remote_run` - sincronización, inicio del navegador, instalación/compilación de OpenClaw o
  validación de la preparación, inicio del Gateway, captura de pantalla y grabación de vídeo.
- `artifacts.copy` - copia de vuelta desde la máquina virtual mediante rsync.

`crabbox.remote_run` puede mostrar `accepted` cuando Crabbox devuelve un estado remoto
distinto de cero, pero Mantis ha copiado metadatos que demuestran que se completó la configuración del Gateway de OpenClaw
o que el propio comando de QA de Slack terminó correctamente. Considera
`accepted` como una ejecución aprobada con explicación, no como un escenario fallido.

Si una ejecución es lenta:

- Si domina la preparación: precompila o promueve una imagen mejor del proveedor de Crabbox.
- Si `remote_run` domina en `source`: usa una concesión activa, mejora la reutilización del almacén
  de pnpm o traslada los requisitos previos de la máquina a la imagen del proveedor.
- Si `remote_run` domina en `prehydrated`: el espacio de trabajo remoto no estaba
  realmente listo, o la configuración del Gateway, el navegador o Slack es lenta.
- Si domina la copia de artefactos: inspecciona el tamaño del vídeo y el contenido del directorio de artefactos.

## Lista de comprobación de evidencias

Un buen comentario de PR muestra:

- el identificador del escenario y el SHA candidato
- la URL de la ejecución de GitHub Actions y la URL del artefacto
- una captura de pantalla insertada del punto de control de aprobación, o una captura de Slack Web desde una
  concesión activa con sesión iniciada
- una vista previa animada insertada cuando esté disponible
- enlaces al MP4 completo y al MP4 recortado
- el estado de aprobación o fallo y el resumen de tiempos del informe

No confirmes capturas de pantalla ni vídeos en el repositorio. Consérvalos en los artefactos de GitHub
Actions o en el comentario del PR.

## Gestión de fallos

Si el flujo de trabajo falla antes de ejecutar la máquina virtual, inspecciona primero el trabajo de Actions.
Causas habituales: `candidate_ref` no confiable, secretos del entorno ausentes o un
fallo de instalación o compilación del candidato.

Si la ejecución de la máquina virtual falla, pero las capturas de pantalla se copiaron de vuelta, inspecciona:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Si la ejecución conservó la concesión, abre VNC con el comando `crabbox vnc ...`
del informe y, después, detén la concesión cuando termines:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Si el inicio de sesión de Slack ha caducado, repáralo mediante VNC en una concesión conservada y vuelve a ejecutar con
`--lease-id`. No incluyas ese perfil del navegador en una imagen del proveedor.

## Contenido relacionado

- [Resumen de QA](/es/concepts/qa-e2e-automation)
- [Canal de Slack](/es/channels/slack)
- [Pruebas](/es/help/testing)
