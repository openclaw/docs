---
read_when:
    - Configuración inicial desde cero
    - Se busca la vía más rápida para disponer de un chat funcional
summary: Instala OpenClaw e inicia tu primer chat en cuestión de minutos.
title: Primeros pasos
x-i18n:
    generated_at: "2026-07-16T12:11:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

Instale OpenClaw, ejecute la incorporación y chatee con su asistente de IA en unos 5
minutos. Al finalizar, tendrá un Gateway en ejecución, la autenticación configurada y una
sesión de chat operativa.

## Lo que necesita

- **Node.js 22.22.3+, 24.15+ o 25.9+** (24 es la versión predeterminada recomendada)
- **Una clave de API** de un proveedor de modelos (Anthropic, OpenAI, Google, etc.); la incorporación se la solicitará

<Tip>
Compruebe su versión de Node con `node --version`.
**Usuarios de Windows:** la aplicación nativa Windows Hub es la opción de escritorio más sencilla. También se admiten
el instalador de PowerShell y las opciones de Gateway mediante WSL2. Consulte [Windows](/es/platforms/windows).
¿Necesita instalar Node? Consulte [Configuración de Node](/es/install/node).
</Tip>

## Configuración rápida

<Steps>
  <Step title="Instalar OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Proceso del script de instalación"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Otros métodos de instalación (Docker, Nix, npm): [Instalación](/es/install).
    </Note>

  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --install-daemon
    ```

    El asistente le guía para elegir un proveedor de modelos, establecer una clave de API
    y configurar el Gateway. QuickStart suele tardar solo unos minutos, pero
    el inicio de sesión en el proveedor, el emparejamiento de canales, la instalación del daemon, las descargas de red, las Skills
    o los plugins opcionales pueden prolongar la incorporación completa. Omita los pasos
    opcionales y vuelva más tarde con `openclaw configure`.

    Consulte [Incorporación (CLI)](/es/start/wizard) para ver la referencia completa.

  </Step>
  <Step title="Verificar que el Gateway esté en ejecución">
    ```bash
    openclaw gateway status
    ```

    Debería ver el Gateway escuchando en el puerto 18789.

  </Step>
  <Step title="Abrir el panel">
    ```bash
    openclaw dashboard
    ```

    Esto abre la interfaz de control en su navegador. Si se carga, todo funciona correctamente.

  </Step>
  <Step title="Enviar su primer mensaje">
    Escriba un mensaje en el chat de la interfaz de control y debería recibir una respuesta de la IA.

    ¿Prefiere chatear desde su teléfono? El canal más rápido de configurar es
    [Telegram](/es/channels/telegram) (solo se necesita un token de bot). Consulte [Canales](/es/channels)
    para conocer todas las opciones.

  </Step>
</Steps>

<Accordion title="Avanzado: montar una compilación personalizada de la interfaz de control">
  Si mantiene una compilación localizada o personalizada del panel, haga que
  `gateway.controlUi.root` apunte a un directorio que contenga sus recursos estáticos
  compilados y `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copie sus archivos estáticos compilados en ese directorio.
```

Después, establezca:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Reinicie el Gateway y vuelva a abrir el panel:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Qué hacer a continuación

<Columns>
  <Card title="Conectar un canal" href="/es/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo y más.
  </Card>
  <Card title="Emparejamiento y seguridad" href="/es/channels/pairing" icon="shield">
    Controle quién puede enviar mensajes a su agente.
  </Card>
  <Card title="Configurar el Gateway" href="/es/gateway/configuration" icon="settings">
    Modelos, herramientas, entorno aislado y configuración avanzada.
  </Card>
  <Card title="Explorar herramientas" href="/es/tools" icon="wrench">
    Navegador, ejecución, búsqueda web, Skills y plugins.
  </Card>
</Columns>

<Accordion title="Avanzado: variables de entorno">
  Si ejecuta OpenClaw como una cuenta de servicio o desea usar rutas personalizadas:

- `OPENCLAW_HOME` — directorio de inicio para la resolución interna de rutas
- `OPENCLAW_STATE_DIR` — sustituye el directorio de estado
- `OPENCLAW_CONFIG_PATH` — sustituye la ruta del archivo de configuración

Referencia completa: [Variables de entorno](/es/help/environment).
</Accordion>

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Descripción general de los canales](/es/channels)
- [Configuración](/es/start/setup)
