---
read_when:
    - Configuración inicial desde cero
    - Quieres la ruta más rápida para tener un chat funcionando
summary: Instala OpenClaw y ejecuta tu primer chat en minutos.
title: Primeros pasos
x-i18n:
    generated_at: "2026-06-28T20:45:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

Instala OpenClaw, ejecuta la incorporación y chatea con tu asistente de IA, todo en
unos 5 minutos. Al final tendrás un Gateway en ejecución, autenticación configurada
y una sesión de chat funcional.

## Lo que necesitas

- **Node.js**: se recomienda Node 24 (también se admite Node 22.19+)
- **Una clave de API** de un proveedor de modelos (Anthropic, OpenAI, Google, etc.); la incorporación te la pedirá

<Tip>
Comprueba tu versión de Node con `node --version`.
**Usuarios de Windows:** la aplicación Hub nativa de Windows es la ruta de escritorio más sencilla. También se admiten las rutas del instalador de PowerShell y Gateway en WSL2. Consulta [Windows](/es/platforms/windows).
¿Necesitas instalar Node? Consulta [Configuración de Node](/es/install/node).
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

    El asistente te guía para elegir un proveedor de modelos, definir una clave de API
    y configurar el Gateway. QuickStart suele tomar solo unos minutos, pero
    el inicio de sesión del proveedor, el emparejamiento de canales, la instalación del daemon, las descargas de red, Skills
    o los plugins opcionales pueden hacer que la incorporación completa tarde más. Puedes omitir los pasos opcionales
    y volver más tarde con `openclaw configure`.

    Consulta [Incorporación (CLI)](/es/start/wizard) para ver la referencia completa.

  </Step>
  <Step title="Verificar que el Gateway esté en ejecución">
    ```bash
    openclaw gateway status
    ```

    Deberías ver el Gateway escuchando en el puerto 18789.

  </Step>
  <Step title="Abrir el panel">
    ```bash
    openclaw dashboard
    ```

    Esto abre la Control UI en tu navegador. Si se carga, todo está funcionando.

  </Step>
  <Step title="Enviar tu primer mensaje">
    Escribe un mensaje en el chat de la Control UI y deberías recibir una respuesta de IA.

    ¿Quieres chatear desde tu teléfono en su lugar? El canal más rápido de configurar es
    [Telegram](/es/channels/telegram) (solo un token de bot). Consulta [Canales](/es/channels)
    para ver todas las opciones.

  </Step>
</Steps>

<Accordion title="Avanzado: montar una compilación personalizada de la Control UI">
  Si mantienes una compilación localizada o personalizada del panel, apunta
  `gateway.controlUi.root` a un directorio que contenga tus recursos estáticos
  compilados e `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Luego configura:

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

Reinicia el Gateway y vuelve a abrir el panel:

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
    Controla quién puede enviar mensajes a tu agente.
  </Card>
  <Card title="Configurar el Gateway" href="/es/gateway/configuration" icon="settings">
    Modelos, herramientas, sandbox y ajustes avanzados.
  </Card>
  <Card title="Explorar herramientas" href="/es/tools" icon="wrench">
    Navegador, exec, búsqueda web, Skills y plugins.
  </Card>
</Columns>

<Accordion title="Avanzado: variables de entorno">
  Si ejecutas OpenClaw como una cuenta de servicio o quieres rutas personalizadas:

- `OPENCLAW_HOME`: directorio de inicio para la resolución de rutas internas
- `OPENCLAW_STATE_DIR`: sobrescribe el directorio de estado
- `OPENCLAW_CONFIG_PATH`: sobrescribe la ruta del archivo de configuración

Referencia completa: [Variables de entorno](/es/help/environment).
</Accordion>

## Relacionado

- [Resumen de instalación](/es/install)
- [Resumen de canales](/es/channels)
- [Configuración](/es/start/setup)
