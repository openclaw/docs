---
read_when:
    - Ejecutar QA de escritorio de Mantis Slack desde GitHub o localmente
    - Depuración de ejecuciones lentas de escritorio de Mantis Slack
    - Elegir el modo de fuente, prehidratado o alquiler preparado
    - Publicar evidencia de capturas de pantalla y video en un PR
summary: 'Manual operativo para QA de escritorio de Mantis Slack: envío de GitHub, CLI local, concesiones VNC precalentadas, modos de hidratación, interpretación de tiempos, artefactos y gestión de errores.'
title: Runbook de escritorio de Slack para Mantis
x-i18n:
    generated_at: "2026-06-27T11:12:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA es la vía de interfaz real para errores de clase Slack que necesitan un escritorio Linux, rescate por VNC, Slack Web, un Gateway real de OpenClaw, capturas de pantalla, videos y un comentario de evidencia en el PR.

Úsala cuando las pruebas unitarias o la vía live headless de Slack no puedan demostrar el error.

## Modelo de almacenamiento

Mantis usa tres capas de almacenamiento diferentes:

- Imagen del proveedor: propiedad de Crabbox y almacenada en la cuenta del proveedor de nube. Contiene capacidades de máquina como Chrome/Chromium, ffmpeg, scrot, Node/corepack/pnpm, herramientas nativas de compilación y directorios de caché vacíos.
- Estado de lease cálido: propiedad de la sesión del operador actual. Puede contener un perfil de navegador con sesión iniciada, `/var/cache/crabbox/pnpm` y un checkout de código fuente preparado mientras el lease está activo.
- Artefactos de Mantis: propiedad de la ejecución de OpenClaw. Viven bajo `.artifacts/qa-e2e/mantis/...`; luego GitHub Actions los sube y la GitHub App de Mantis comenta evidencia inline en el PR.

Nunca pongas secretos, cookies del navegador, estado de inicio de sesión de Slack, checkouts del repositorio, `node_modules` ni `dist/` en una imagen de proveedor preconstruida.

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

Los valores permitidos de `candidate_ref` son intencionalmente restringidos porque el workflow usa credenciales live: ascendencia actual de `main`, etiquetas de release o la cabecera de un PR abierto desde `openclaw/openclaw`.

El workflow escribe:

- artefacto subido: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- comentario inline en el PR desde la GitHub App de Mantis;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- logs remotos como `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log` y `ffmpeg.log`.

El comentario del PR se actualiza en el lugar mediante el marcador oculto `<!-- mantis-slack-desktop-smoke -->`.

## CLI local

Prueba fría desde código fuente:

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

Conservar la VM para rescate por VNC:

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

Reutilizar un lease cálido:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Usa `--hydrate-mode prehydrated` solo cuando el workspace remoto reutilizado ya tenga `node_modules` y un `dist/` compilado. Mantis falla de forma cerrada si faltan.

Demostrar la interfaz nativa de aprobación de Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

El modo de checkpoints de aprobación es mutuamente excluyente con `--gateway-setup`. Ejecuta los escenarios opt-in `slack-approval-exec-native` y `slack-approval-plugin-native`, salvo que pases flags `--scenario` explícitos para checkpoints de aprobación; los demás escenarios de Slack se rechazan antes de que arranque la VM. El runner de QA de Slack escribe cada archivo JSON de checkpoint a partir del mensaje real de la API de Slack que observó; luego el watcher remoto renderiza esa instantánea del mensaje en `approval-checkpoints/<scenario>-pending.png` y `approval-checkpoints/<scenario>-resolved.png`. La ejecución falla si falta o está vacío cualquier JSON de checkpoint, evidencia de mensaje, JSON de ack o captura renderizada.

Los leases fríos de GitHub Actions no tienen cookies de Slack Web, por lo que su captura del navegador puede terminar en el inicio de sesión de Slack. Para la prueba de checkpoints de aprobación, confía en las imágenes de checkpoint renderizadas y los artefactos de QA de Slack en lugar de `slack-desktop-smoke.png`. Usa un lease cálido conservado con un perfil de Slack Web con sesión iniciada manualmente solo cuando la captura del navegador deba mostrar Slack Web.

## Modos de hidratación

| Modo          | Usar cuando                               | Comportamiento remoto                                                                 | Compensación                                             |
| ------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Prueba normal de PR, máquinas frías, CI   | Ejecuta `pnpm install --frozen-lockfile --prefer-offline` y `pnpm build` dentro de la VM | La más lenta, la prueba más sólida de checkout de código |
| `prehydrated` | Preparaste intencionalmente un lease reutilizado | Requiere `node_modules` y `dist/` existentes; omite install/build                  | Rápida, pero solo válida para leases cálidos controlados por el operador |

GitHub Actions siempre prepara el checkout candidato antes de la ejecución en la VM. Su store de pnpm se cachea por SO, versión de Node y lockfile. La ejecución fuente en la VM también usa `/var/cache/crabbox/pnpm` cuando está presente.

## Interpretación de tiempos

`mantis-slack-desktop-smoke-report.md` incluye tiempos por fase:

- `crabbox.warmup`: arranque del proveedor de nube, preparación de escritorio/navegador y SSH.
- `crabbox.inspect`: búsqueda de metadatos del lease.
- `credentials.prepare`: adquisición del lease de credenciales de Convex.
- `crabbox.remote_run`: sincronización, lanzamiento del navegador, instalación/compilación de OpenClaw o validación de hidratación, arranque del Gateway, captura de pantalla y captura de video.
- `artifacts.copy`: rsync de vuelta desde la VM.

`crabbox.remote_run` puede marcarse como `accepted` cuando Crabbox devuelve un estado remoto distinto de cero después de que Mantis haya copiado metadatos que demuestran que se completó la configuración del Gateway de OpenClaw o que el comando de QA de Slack salió correctamente. Trata `accepted` como aprobado con explicación, no como un escenario fallido.

Si la ejecución es lenta:

- domina warmup: preconstruye o promueve una mejor imagen de proveedor de Crabbox;
- domina remote_run en `source`: usa un lease cálido, mejora la reutilización del store de pnpm o mueve los prerrequisitos de máquina a la imagen del proveedor;
- domina remote_run en `prehydrated`: el workspace remoto en realidad no estaba listo, o la configuración del Gateway/navegador/Slack es lenta;
- domina la copia de artefactos: inspecciona el tamaño del video y el contenido del directorio de artefactos.

## Lista de verificación de evidencia

Un buen comentario de PR debe mostrar:

- id del escenario y SHA candidato;
- URL de la ejecución de GitHub Actions;
- URL del artefacto;
- captura inline del checkpoint de aprobación, o una captura de Slack Web desde un lease cálido con sesión iniciada;
- vista previa animada inline cuando esté disponible;
- enlaces al MP4 completo y al MP4 recortado;
- estado aprobado/fallido;
- resumen de tiempos en el informe adjunto.

No confirmes capturas de pantalla ni videos en el repositorio. Mantenlos en artefactos de GitHub Actions o en el comentario del PR.

## Manejo de fallos

Si el workflow falla antes de la ejecución de la VM, inspecciona primero el job de Actions. Las causas típicas son un `candidate_ref` no confiable, secretos de entorno faltantes o fallo de instalación/compilación del candidato.

Si la ejecución de la VM falla pero las capturas de pantalla se copiaron de vuelta, inspecciona:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Si la ejecución conservó el lease, abre VNC con el comando `crabbox vnc ...` del informe. Detén el lease cuando termines:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Si el inicio de sesión de Slack caducó, repáralo en VNC sobre un lease conservado y vuelve a ejecutar con `--lease-id`. No hornees ese perfil de navegador en una imagen de proveedor.

## Relacionado

- [Resumen de QA](/es/concepts/qa-e2e-automation)
- [Canal de Slack](/es/channels/slack)
- [Pruebas](/es/help/testing)
