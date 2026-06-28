---
read_when:
    - Primeira configuração do zero
    - Você quer o caminho mais rápido para um chat funcional
summary: Instale o OpenClaw e execute seu primeiro chat em minutos.
title: Introdução
x-i18n:
    generated_at: "2026-06-28T20:44:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

Instale o OpenClaw, execute o onboarding e converse com seu assistente de IA — tudo em
cerca de 5 minutos. Ao final, você terá um Gateway em execução, autenticação configurada
e uma sessão de chat funcionando.

## O que você precisa

- **Node.js** — Node 24 recomendado (Node 22.19+ também é compatível)
- **Uma chave de API** de um provedor de modelo (Anthropic, OpenAI, Google etc.) — o onboarding solicitará isso

<Tip>
Verifique sua versão do Node com `node --version`.
**Usuários de Windows:** o app nativo Windows Hub é o caminho de desktop mais fácil. O
instalador do PowerShell e os caminhos do Gateway via WSL2 também são compatíveis. Consulte [Windows](/pt-BR/platforms/windows).
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
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    O assistente orienta você na escolha de um provedor de modelo, na definição de uma chave de API
    e na configuração do Gateway. O QuickStart normalmente leva apenas alguns minutos, mas
    login no provedor, pareamento de canais, instalação do daemon, downloads de rede, Skills
    ou plugins opcionais podem fazer o onboarding completo levar mais tempo. Você pode pular etapas
    opcionais e voltar depois com `openclaw configure`.

    Consulte [Onboarding (CLI)](/pt-BR/start/wizard) para a referência completa.

  </Step>
  <Step title="Verifique se o Gateway está em execução">
    ```bash
    openclaw gateway status
    ```

    Você deve ver o Gateway escutando na porta 18789.

  </Step>
  <Step title="Abra o painel">
    ```bash
    openclaw dashboard
    ```

    Isso abre a Control UI no seu navegador. Se ela carregar, tudo está funcionando.

  </Step>
  <Step title="Envie sua primeira mensagem">
    Digite uma mensagem no chat da Control UI e você deverá receber uma resposta da IA.

    Quer conversar pelo telefone? O canal mais rápido de configurar é
    [Telegram](/pt-BR/channels/telegram) (apenas um token de bot). Consulte [Canais](/pt-BR/channels)
    para ver todas as opções.

  </Step>
</Steps>

<Accordion title="Avançado: monte uma build personalizada da Control UI">
  Se você mantém uma build localizada ou personalizada do painel, aponte
  `gateway.controlUi.root` para um diretório que contenha seus ativos estáticos
  compilados e `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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

Reinicie o gateway e reabra o painel:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## O que fazer a seguir

<Columns>
  <Card title="Conecte um canal" href="/pt-BR/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e mais.
  </Card>
  <Card title="Pareamento e segurança" href="/pt-BR/channels/pairing" icon="shield">
    Controle quem pode enviar mensagens ao seu agente.
  </Card>
  <Card title="Configure o Gateway" href="/pt-BR/gateway/configuration" icon="settings">
    Modelos, ferramentas, sandbox e configurações avançadas.
  </Card>
  <Card title="Explore ferramentas" href="/pt-BR/tools" icon="wrench">
    Navegador, exec, pesquisa na web, Skills e plugins.
  </Card>
</Columns>

<Accordion title="Avançado: variáveis de ambiente">
  Se você executa o OpenClaw como uma conta de serviço ou quer caminhos personalizados:

- `OPENCLAW_HOME` — diretório inicial para resolução de caminhos internos
- `OPENCLAW_STATE_DIR` — substitui o diretório de estado
- `OPENCLAW_CONFIG_PATH` — substitui o caminho do arquivo de configuração

Referência completa: [Variáveis de ambiente](/pt-BR/help/environment).
</Accordion>

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Visão geral dos canais](/pt-BR/channels)
- [Configuração](/pt-BR/start/setup)
