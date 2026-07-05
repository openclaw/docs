---
read_when:
    - Implementar OpenClaw en EasyRunner
    - Ejecutar el Gateway detrás del proxy Caddy de EasyRunner
    - Elegir volúmenes persistentes y autenticación para un Gateway alojado
summary: Ejecuta el Gateway de OpenClaw en EasyRunner con Podman y Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-05T11:28:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner aloja el Gateway de OpenClaw como una pequeña aplicación en contenedor detrás de su
proxy Caddy. Esta guía presupone un host EasyRunner que ejecuta aplicaciones Compose
compatibles con Podman y termina HTTPS mediante Caddy.

## Antes de empezar

- Un servidor EasyRunner con un dominio dirigido a él.
- La imagen oficial de OpenClaw (`ghcr.io/openclaw/openclaw`) o tu propia compilación.
- Un volumen de configuración persistente para `/home/node/.openclaw`.
- Un volumen de workspace persistente para `/home/node/.openclaw/workspace`.
- Un token o contraseña de Gateway fuerte.

Mantén habilitada la autenticación de dispositivos cuando sea posible. Si tu proxy inverso no puede transportar
correctamente la identidad del dispositivo, corrige primero la configuración de proxy de confianza (consulta
[Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)); usa omisiones peligrosas de autenticación
solo en una red completamente privada y controlada por el operador.

## Aplicación Compose

Crea una aplicación EasyRunner con un archivo Compose con esta forma:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Sustituye `openclaw.example.com` por el nombre de host de tu Gateway. Guarda
`OPENCLAW_GATEWAY_TOKEN` en el gestor de secretos/entorno de EasyRunner en lugar de
confirmarlo en la definición de la aplicación. La imagen se enlaza a loopback de forma predeterminada,
por lo que el `--bind lan --port 1455` explícito en `command` es necesario para que Caddy pueda
alcanzar el contenedor.

## Configurar OpenClaw

Dentro del volumen de configuración persistente, mantén el Gateway accesible solo a través
del proxy y exige autenticación:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Si Caddy termina TLS para el Gateway, configura los ajustes de proxy de confianza para
la ruta exacta del proxy en lugar de deshabilitar globalmente las comprobaciones de autenticación. Consulta
[Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).

## Verificar

Desde tu estación de trabajo:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Desde el host EasyRunner, `GET /healthz` (liveness) y `GET /readyz`
(readiness) no necesitan autenticación y respaldan la comprobación de estado de contenedor
integrada de la imagen. Revisa también los registros de la aplicación para confirmar que el Gateway está escuchando
y que no hay fallos de inicio de SecretRef, Plugin o autenticación de canal.

## Actualizaciones y copias de seguridad

- Descarga o compila la nueva imagen de OpenClaw y vuelve a desplegar la aplicación EasyRunner.
- Haz una copia de seguridad del volumen `openclaw-config` antes de las actualizaciones. Contiene
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` y el estado de paquetes de
  Plugin instalados.
- Haz una copia de seguridad de `openclaw-workspace` si los agentes escriben allí datos de proyecto duraderos.
- Ejecuta `openclaw doctor` después de actualizaciones importantes para detectar migraciones de configuración y
  advertencias de servicio.

## Solución de problemas

- `gateway probe` no puede conectarse: confirma que el nombre de host de Caddy apunta a la aplicación
  y que el contenedor escucha en `0.0.0.0:1455`.
- La autenticación falla: rota el token en los secretos de EasyRunner y en el comando del cliente local
  a la vez.
- Los archivos pertenecen a root después de restaurar: la imagen se ejecuta como `node` (uid 1000);
  repara los volúmenes montados para que ese usuario pueda escribir en
  `/home/node/.openclaw` y `/home/node/.openclaw/workspace`.
- Fallan los plugins de navegador o canal: comprueba si los binarios externos,
  la salida de red y las credenciales montadas requeridas están disponibles dentro del
  contenedor.
