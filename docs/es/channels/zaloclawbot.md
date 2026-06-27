---
read_when:
    - Quieres un bot asistente personal de Zalo con inicio de sesión mediante código QR
    - Está instalando o solucionando problemas del plugin de canal openclaw-zaloclawbot.
summary: Configuración del canal Zalo ClawBot mediante el Plugin externo openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T10:48:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw se conecta a Zalo ClawBot mediante el Plugin externo
`@zalo-platforms/openclaw-zaloclawbot` incluido en el catálogo. El inicio de sesión usa un código QR de Zalo Mini App.

## Compatibilidad

| Versión del Plugin | Versión de OpenClaw | dist-tag de npm | Estado        |
| ------------------ | ------------------- | --------------- | ------------- |
| 0.1.x              | >=2026.4.10         | `latest`        | Activo / Beta |

## Requisitos previos

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install) debe estar instalado (CLI `openclaw` disponible).
- Una cuenta de Zalo en un dispositivo móvil para escanear el código QR de inicio de sesión.

## Instalar con onboard (recomendado)

Ejecuta el asistente de incorporación de OpenClaw y elige **Zalo ClawBot** en el menú de canales:

```bash
openclaw onboard
```

El asistente instala el Plugin desde el catálogo oficial (con integridad verificada), muestra el QR de inicio de sesión directamente en la terminal y finaliza la configuración del canal cuando lo escaneas con la app de Zalo. No se necesitan comandos adicionales.

## Instalación manual

Para agregar el canal a un Gateway ya incorporado, sigue estos pasos:

### 1. Instala el Plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Usa la versión exacta fijada que se muestra arriba (coincide con la entrada del catálogo oficial), para que OpenClaw verifique el paquete contra el hash de integridad del catálogo durante la instalación.

### 2. Habilita el Plugin en la configuración

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Genera el código QR e inicia sesión

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Escanea el código QR mostrado en la terminal con la app móvil de Zalo, acepta los Términos de uso dentro de Zalo Mini App y autoriza la sesión.

### 4. Reinicia el Gateway

```bash
openclaw gateway restart
```

---

## Cómo funciona

A diferencia del canal estándar de desarrollador de Zalo, que requiere registrar tu propia Zalo Official Account (OA) y pegar credenciales estáticas de desarrollador, Zalo ClawBot funciona como un **asistente personal vinculado al propietario** usando una infraestructura oficial compartida:

1. **Incorporación segura:** El código QR resuelve a una Zalo Mini App segura que vincula un bot privado recién aprovisionado bajo una OA oficial compartida directamente a tu ID de usuario de Zalo.
2. **Privacidad vinculada al propietario:** Por diseño, el bot está restringido a comunicarse _solo_ con su propietario. Los mensajes de otros usuarios se descartan a nivel de plataforma, lo que hace que la conexión sea privada y segura.
3. **Ruta de API oficial:** El Plugin usa las API de Zalo Bot Platform en lugar de automatización de navegador o de sesión web.

## Funcionamiento interno

El Plugin Zalo ClawBot se comunica con las API de Zalo mediante un bucle persistente de mensajes con sondeo largo. Para mantener un entorno de ejecución limpio y ligero:

- Las conexiones de sondeo largo utilizan el endpoint `getUpdates`.
- Los Webhooks están deshabilitados de forma predeterminada para ejecuciones locales de Gateway en escritorio/terminal.
- Los mensajes se procesan del lado del cliente y se asignan directamente al entorno de ejecución de tu agente local.

El Plugin externo administra las credenciales del bot dentro del directorio de estado de OpenClaw.
Trata ese directorio como confidencial e inclúyelo en la misma política de control de acceso y
copias de seguridad que el resto de tu estado de OpenClaw.

---

## Solución de problemas

- **Tiempo de espera agotado del inicio de sesión con QR:** El token de inicio de sesión (`zbsk`) caduca después de 5 minutos por motivos de seguridad. Si el código QR caduca antes de que lo escanees, simplemente vuelve a ejecutar el comando de inicio de sesión para generar uno nuevo.
- **El Gateway no se carga:** Asegúrate de que la versión de tu host OpenClaw sea `2026.4.10` o superior. Las versiones anteriores no admiten el registro de instalación de plugins externos de npm.
