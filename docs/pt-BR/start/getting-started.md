---
read_when:
    - Primeira configuração do zero
    - Você quer o caminho mais rápido para um chat funcionando
summary: Instale o OpenClaw e execute seu primeiro chat em minutos.
title: Primeiros passos
x-i18n:
    generated_at: "2026-04-24T06:13:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

Instale o OpenClaw, execute o onboarding e converse com seu assistente de IA — tudo em
cerca de 5 minutos. No final, você terá um Gateway em execução, autenticação configurada
e uma sessão de chat funcionando.

## O que você precisa

- **Node.js** — Node 24 recomendado (Node 22.14+ também é compatível)
- **Uma chave de API** de um provedor de modelo (Anthropic, OpenAI, Google etc.) — o onboarding solicitará isso

<Tip>
Verifique sua versão do Node com `node --version`.
**Usuários do Windows:** tanto Windows nativo quanto WSL2 são compatíveis. WSL2 é mais
estável e recomendado para a experiência completa. Consulte [Windows](/pt-BR/platforms/windows).
Precisa instalar o Node? Consulte [Node setup](/pt-BR/install/node).
</Tip>

## Configuração rápida

<Steps>
  <Step title="Instalar o OpenClaw">
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
    Outros métodos de instalação (Docker, Nix, npm): [Install](/pt-BR/install).
    </Note>

  </Step>
  <Step title="Executar o onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    O assistente orienta você na escolha de um provedor de modelo, na definição de uma chave de API
    e na configuração do Gateway. Leva cerca de 2 minutos.

    Consulte [Onboarding (CLI)](/pt-BR/start/wizard) para a referência completa.

  </Step>
  <Step title="Verificar se o Gateway está em execução">
    ```bash
    openclaw gateway status
    ```

    Você deve ver o Gateway escutando na porta 18789.

  </Step>
  <Step title="Abrir o dashboard">
    ```bash
    openclaw dashboard
    ```

    Isso abre a Control UI no navegador. Se ela carregar, está tudo funcionando.

  </Step>
  <Step title="Enviar sua primeira mensagem">
    Digite uma mensagem no chat da Control UI e você deverá receber uma resposta da IA.

    Quer conversar pelo celular em vez disso? O canal mais rápido de configurar é
    [Telegram](/pt-BR/channels/telegram) (apenas um token de bot). Consulte [Channels](/pt-BR/channels)
    para ver todas as opções.

  </Step>
</Steps>

<Accordion title="Avançado: montar um build personalizado da Control UI">
  Se você mantém um build localizado ou personalizado do dashboard, aponte
  `gateway.controlUi.root` para um diretório que contenha seus assets estáticos
  gerados e `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copie seus arquivos estáticos gerados para esse diretório.
```

Depois defina:

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

Reinicie o gateway e reabra o dashboard:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## O que fazer em seguida

<Columns>
  <Card title="Conectar um canal" href="/pt-BR/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e mais.
  </Card>
  <Card title="Pareamento e segurança" href="/pt-BR/channels/pairing" icon="shield">
    Controle quem pode enviar mensagens ao seu agente.
  </Card>
  <Card title="Configurar o Gateway" href="/pt-BR/gateway/configuration" icon="settings">
    Modelos, ferramentas, sandbox e configurações avançadas.
  </Card>
  <Card title="Explorar ferramentas" href="/pt-BR/tools" icon="wrench">
    Browser, exec, web search, Skills e Plugins.
  </Card>
</Columns>

<Accordion title="Avançado: variáveis de ambiente">
  Se você executa o OpenClaw como conta de serviço ou quer caminhos personalizados:

- `OPENCLAW_HOME` — diretório home para resolução interna de caminhos
- `OPENCLAW_STATE_DIR` — sobrescrever o diretório de estado
- `OPENCLAW_CONFIG_PATH` — sobrescrever o caminho do arquivo de configuração

Referência completa: [Environment variables](/pt-BR/help/environment).
</Accordion>

## Relacionados

- [Install overview](/pt-BR/install)
- [Channels overview](/pt-BR/channels)
- [Setup](/pt-BR/start/setup)
