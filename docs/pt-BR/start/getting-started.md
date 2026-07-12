---
read_when:
    - Configuração inicial do zero
    - Você quer o caminho mais rápido para ter um chat funcionando
summary: Instale o OpenClaw e inicie seu primeiro chat em poucos minutos.
title: Primeiros passos
x-i18n:
    generated_at: "2026-07-12T15:38:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Instale o OpenClaw, execute a integração inicial e converse com seu assistente de IA em cerca de 5
minutos. Ao final, você terá um Gateway em execução, autenticação configurada e uma
sessão de chat funcionando.

## O que você precisa

- **Node.js 22.19+, 23.11+ ou 24+** (24 é a versão padrão recomendada)
- **Uma chave de API** de um provedor de modelos (Anthropic, OpenAI, Google etc.) — ela será solicitada durante a integração inicial

<Tip>
Verifique sua versão do Node com `node --version`.
**Usuários do Windows:** o aplicativo Hub nativo para Windows é a opção mais fácil para desktop. O
instalador do PowerShell e as opções de Gateway no WSL2 também são compatíveis. Consulte [Windows](/pt-BR/platforms/windows).
Precisa instalar o Node? Consulte [Configuração do Node](/pt-BR/install/node).
</Tip>

## Configuração rápida

<Steps>
  <Step title="Instale o OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Processo do script de instalação"
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
    Outros métodos de instalação (Docker, Nix, npm): [Instalação](/pt-BR/install).
    </Note>

  </Step>
  <Step title="Execute a integração inicial">
    ```bash
    openclaw onboard --install-daemon
    ```

    O assistente orienta você na escolha de um provedor de modelos, na definição de uma chave de API
    e na configuração do Gateway. O QuickStart geralmente leva apenas alguns minutos, mas
    o login no provedor, o pareamento de canais, a instalação do daemon, os downloads de rede, as Skills
    ou os plugins opcionais podem fazer com que a integração inicial completa demore mais. Pule as etapas
    opcionais e retorne mais tarde com `openclaw configure`.

    Consulte [Integração inicial (CLI)](/pt-BR/start/wizard) para ver a referência completa.

  </Step>
  <Step title="Verifique se o Gateway está em execução">
    ```bash
    openclaw gateway status
    ```

    Você deverá ver o Gateway escutando na porta 18789.

  </Step>
  <Step title="Abra o painel">
    ```bash
    openclaw dashboard
    ```

    Isso abre a interface de controle no navegador. Se ela carregar, tudo está funcionando.

  </Step>
  <Step title="Envie sua primeira mensagem">
    Digite uma mensagem no chat da interface de controle e você deverá receber uma resposta da IA.

    Prefere conversar pelo celular? O canal mais rápido de configurar é o
    [Telegram](/pt-BR/channels/telegram) (basta um token de bot). Consulte [Canais](/pt-BR/channels)
    para ver todas as opções.

  </Step>
</Steps>

<Accordion title="Avançado: monte uma compilação personalizada da interface de controle">
  Se você mantém uma compilação localizada ou personalizada do painel, aponte
  `gateway.controlUi.root` para um diretório que contenha seus arquivos estáticos
  compilados e o `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copie seus arquivos estáticos compilados para esse diretório.
```

Em seguida, defina:

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

Reinicie o Gateway e reabra o painel:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Próximas etapas

<Columns>
  <Card title="Conecte um canal" href="/pt-BR/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e outros.
  </Card>
  <Card title="Pareamento e segurança" href="/pt-BR/channels/pairing" icon="shield">
    Controle quem pode enviar mensagens ao seu agente.
  </Card>
  <Card title="Configure o Gateway" href="/pt-BR/gateway/configuration" icon="settings">
    Modelos, ferramentas, sandbox e configurações avançadas.
  </Card>
  <Card title="Explore as ferramentas" href="/pt-BR/tools" icon="wrench">
    Navegador, execução, pesquisa na web, Skills e plugins.
  </Card>
</Columns>

<Accordion title="Avançado: variáveis de ambiente">
  Se você executar o OpenClaw como uma conta de serviço ou quiser usar caminhos personalizados:

- `OPENCLAW_HOME` — diretório inicial para resolução de caminhos internos
- `OPENCLAW_STATE_DIR` — substitui o diretório de estado
- `OPENCLAW_CONFIG_PATH` — substitui o caminho do arquivo de configuração

Referência completa: [Variáveis de ambiente](/pt-BR/help/environment).
</Accordion>

## Conteúdo relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Visão geral dos canais](/pt-BR/channels)
- [Configuração](/pt-BR/start/setup)
