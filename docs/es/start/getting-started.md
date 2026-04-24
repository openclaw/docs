---
read_when:
    - Configuración inicial desde cero
    - Quieres la ruta más rápida hacia un chat funcional
summary: Instala OpenClaw y ejecuta tu primer chat en minutos.
title: Primeros pasos
x-i18n:
    generated_at: "2026-04-24T05:50:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

Instala OpenClaw, ejecuta onboarding y chatea con tu asistente de IA, todo en
unos 5 minutos. Al final tendrás un Gateway en ejecución, autenticación configurada
y una sesión de chat funcional.

## Qué necesitas

- **Node.js**: se recomienda Node 24 (también se admite Node 22.14+)
- **Una API key** de un proveedor de modelos (Anthropic, OpenAI, Google, etc.); onboarding te la solicitará

<Tip>
Comprueba tu versión de Node con `node --version`.
**Usuarios de Windows:** se admiten tanto Windows nativo como WSL2. WSL2 es más
estable y recomendado para la experiencia completa. Consulta [Windows](/es/platforms/windows).
¿Necesitas instalar Node? Consulta [Configuración de Node](/es/install/node).
</Tip>

## Configuración rápida

<Steps>
  <Step title="Instala OpenClaw">
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
  <Step title="Ejecuta onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    El asistente te guía para elegir un proveedor de modelos, configurar una API key
    y configurar el Gateway. Tarda unos 2 minutos.

    Consulta [Onboarding (CLI)](/es/start/wizard) para la referencia completa.

  </Step>
  <Step title="Verifica que el Gateway está en ejecución">
    ```bash
    openclaw gateway status
    ```

    Deberías ver el Gateway escuchando en el puerto 18789.

  </Step>
  <Step title="Abre el dashboard">
    ```bash
    openclaw dashboard
    ```

    Esto abre la Control UI en tu navegador. Si carga, todo funciona.

  </Step>
  <Step title="Envía tu primer mensaje">
    Escribe un mensaje en el chat de la Control UI y deberías recibir una respuesta de IA.

    ¿Quieres chatear desde tu teléfono? El canal más rápido de configurar es
    [Telegram](/es/channels/telegram) (solo necesitas un token de bot). Consulta [Canales](/es/channels)
    para ver todas las opciones.

  </Step>
</Steps>

<Accordion title="Avanzado: montar una compilación personalizada de Control UI">
  Si mantienes una compilación localizada o personalizada del dashboard, apunta
  `gateway.controlUi.root` a un directorio que contenga tus recursos estáticos
  compilados y `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copia tus archivos estáticos compilados en ese directorio.
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

Reinicia el gateway y vuelve a abrir el dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Qué hacer después

<Columns>
  <Card title="Conectar un canal" href="/es/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo y más.
  </Card>
  <Card title="Pairing y seguridad" href="/es/channels/pairing" icon="shield">
    Controla quién puede enviar mensajes a tu agente.
  </Card>
  <Card title="Configurar el Gateway" href="/es/gateway/configuration" icon="settings">
    Modelos, herramientas, sandbox y configuración avanzada.
  </Card>
  <Card title="Explorar herramientas" href="/es/tools" icon="wrench">
    Browser, exec, búsqueda web, Skills y Plugins.
  </Card>
</Columns>

<Accordion title="Avanzado: variables de entorno">
  Si ejecutas OpenClaw como cuenta de servicio o quieres rutas personalizadas:

- `OPENCLAW_HOME`: directorio home para la resolución interna de rutas
- `OPENCLAW_STATE_DIR`: sobrescribe el directorio de estado
- `OPENCLAW_CONFIG_PATH`: sobrescribe la ruta del archivo de configuración

Referencia completa: [Variables de entorno](/es/help/environment).
</Accordion>

## Relacionado

- [Resumen de instalación](/es/install)
- [Resumen de canales](/es/channels)
- [Configuración](/es/start/setup)
