---
read_when:
    - Alojar PeekabooBridge en OpenClaw.app
    - Integrar Peekaboo mediante Swift Package Manager
    - Cambiar el protocolo/rutas de PeekabooBridge
summary: Integración de PeekabooBridge para automatización de interfaz en macOS
title: Puente Peekaboo
x-i18n:
    generated_at: "2026-04-24T05:38:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw puede alojar **PeekabooBridge** como un broker local y consciente de permisos para automatización de interfaz.
Esto permite que la CLI `peekaboo` controle la automatización de interfaz reutilizando los
permisos TCC de la app de macOS.

## Qué es esto (y qué no es)

- **Host**: OpenClaw.app puede actuar como host de PeekabooBridge.
- **Cliente**: usa la CLI `peekaboo` (sin una superficie independiente `openclaw ui ...`).
- **UI**: las superposiciones visuales permanecen en Peekaboo.app; OpenClaw es un host broker ligero.

## Habilitar el puente

En la app de macOS:

- Ajustes → **Enable Peekaboo Bridge**

Cuando está habilitado, OpenClaw inicia un servidor local de socket UNIX. Si está deshabilitado, el host
se detiene y `peekaboo` recurrirá a otros hosts disponibles.

## Orden de descubrimiento del cliente

Los clientes Peekaboo suelen probar hosts en este orden:

1. Peekaboo.app (experiencia completa)
2. Claude.app (si está instalada)
3. OpenClaw.app (broker ligero)

Usa `peekaboo bridge status --verbose` para ver qué host está activo y qué
ruta de socket se está usando. Puedes sobrescribirlo con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Seguridad y permisos

- El puente valida **firmas de código del llamador**; se aplica una lista de permitidos de TeamID
  (TeamID del host Peekaboo + TeamID de la app OpenClaw).
- Las solicitudes agotan el tiempo tras ~10 segundos.
- Si faltan permisos requeridos, el puente devuelve un mensaje de error claro
  en lugar de abrir Ajustes del sistema.

## Comportamiento de instantáneas (automatización)

Las instantáneas se almacenan en memoria y caducan automáticamente después de un intervalo corto.
Si necesitas una retención más larga, vuelve a capturarlas desde el cliente.

## Solución de problemas

- Si `peekaboo` informa “bridge client is not authorized”, asegúrate de que el cliente esté
  correctamente firmado o ejecuta el host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  solo en modo **debug**.
- Si no se encuentra ningún host, abre una de las apps host (Peekaboo.app o OpenClaw.app)
  y confirma que se hayan concedido los permisos.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [permisos de macOS](/es/platforms/mac/permissions)
