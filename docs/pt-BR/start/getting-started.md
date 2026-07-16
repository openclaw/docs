---
read_when:
    - Configuração inicial do zero
    - Você quer o caminho mais rápido para ter um chat funcionando
summary: Instale o OpenClaw e inicie seu primeiro chat em poucos minutos.
title: Primeiros passos
x-i18n:
    generated_at: "2026-07-16T12:58:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

Instale o OpenClaw, execute a integração inicial e converse com seu assistente de IA em cerca de 5
minutos. Ao final, você terá um Gateway em execução, autenticação configurada e uma
sessão de chat funcionando.

## O que é necessário

- **Node.js 22.22.3+, 24.15+ ou 25.9+** (24 é a versão padrão recomendada)
- **Uma chave de API** de um provedor de modelos (Anthropic, OpenAI, Google etc.) — a integração inicial solicitará essa chave

<Tip>
Verifique sua versão do Node com `node --version`.
**Usuários do Windows:** o aplicativo Hub nativo para Windows é a opção mais fácil para desktop. O
instalador do PowerShell e as opções de Gateway no WSL2 também são compatíveis. Consulte [Windows](/pt-BR/platforms/windows).
Precisa instalar o Node? Consulte [Configuração do Node](/pt-BR/install/node).
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
    Outros métodos de instalação (Docker, Nix, npm): [Instalação](/pt-BR/install).
    </Note>

  </Step>
  <Step title="Executar a integração inicial">
    ```bash
    openclaw onboard --install-daemon
    ```

    O assistente orienta você na escolha de um provedor de modelos, na definição de uma chave de API
    e na configuração do Gateway. O QuickStart geralmente leva apenas alguns minutos, mas
    o login no provedor, o pareamento de canais, a instalação do daemon, os downloads de rede, as Skills
    ou os plugins opcionais podem fazer com que a integração inicial completa demore mais. Pule as etapas
    opcionais e retorne mais tarde com `openclaw configure`.

    Consulte [Integração inicial (CLI)](/pt-BR/start/wizard) para obter a referência completa.

  </Step>
  <Step title="Verificar se o Gateway está em execução">
    ```bash
    openclaw gateway status
    ```

    O Gateway deverá aparecer escutando na porta 18789.

  </Step>
  <Step title="Abrir o painel">
    ```bash
    openclaw dashboard
    ```

    Isso abre a interface de controle no navegador. Se ela carregar, tudo está funcionando.

  </Step>
  <Step title="Enviar sua primeira mensagem">
    Digite uma mensagem no chat da interface de controle e você deverá receber uma resposta da IA.

    Prefere conversar pelo celular? O canal mais rápido de configurar é
    [Telegram](/pt-BR/channels/telegram) (basta um token de bot). Consulte [Canais](/pt-BR/channels)
    para ver todas as opções.

  </Step>
</Steps>

<Accordion title="Avançado: montar uma compilação personalizada da interface de controle">
  Se você mantém uma compilação localizada ou personalizada do painel, aponte
  `gateway.controlUi.root` para um diretório que contenha seus recursos estáticos
  compilados e `index.html`.

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
  <Card title="Conectar um canal" href="/pt-BR/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e outros.
  </Card>
  <Card title="Pareamento e segurança" href="/pt-BR/channels/pairing" icon="shield">
    Controle quem pode enviar mensagens ao seu agente.
  </Card>
  <Card title="Configurar o Gateway" href="/pt-BR/gateway/configuration" icon="settings">
    Modelos, ferramentas, sandbox e configurações avançadas.
  </Card>
  <Card title="Explorar ferramentas" href="/pt-BR/tools" icon="wrench">
    Navegador, execução, pesquisa na web, Skills e plugins.
  </Card>
</Columns>

<Accordion title="Avançado: variáveis de ambiente">
  Se você executa o OpenClaw com uma conta de serviço ou deseja caminhos personalizados:

- `OPENCLAW_HOME` — diretório inicial para resolução interna de caminhos
- `OPENCLAW_STATE_DIR` — substitui o diretório de estado
- `OPENCLAW_CONFIG_PATH` — substitui o caminho do arquivo de configuração

Referência completa: [Variáveis de ambiente](/pt-BR/help/environment).
</Accordion>

## Conteúdo relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Visão geral dos canais](/pt-BR/channels)
- [Configuração](/pt-BR/start/setup)
