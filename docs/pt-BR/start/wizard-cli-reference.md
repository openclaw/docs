---
read_when:
    - Você precisa do comportamento detalhado de `openclaw onboard`
    - Você está depurando resultados do onboarding ou integrando clientes de onboarding
sidebarTitle: CLI reference
summary: Referência completa para o fluxo de configuração pela CLI, configuração de autenticação/modelo, saídas e internals
title: Referência de configuração da CLI
x-i18n:
    generated_at: "2026-04-24T06:13:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Esta página é a referência completa para `openclaw onboard`.
Para o guia curto, consulte [Onboarding (CLI)](/pt-BR/start/wizard).

## O que o assistente faz

O modo local (padrão) orienta você por:

- Configuração de modelo e autenticação (OAuth da assinatura OpenAI Code, Anthropic Claude CLI ou chave de API, além de opções MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Local do workspace e arquivos de bootstrap
- Configurações do Gateway (porta, bind, autenticação, tailscale)
- Canais e provedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles e outros Plugins de canal incluídos)
- Instalação de daemon (LaunchAgent, systemd user unit ou tarefa agendada nativa do Windows com fallback para pasta Startup)
- Verificação de integridade
- Configuração de Skills

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.
Ele não instala nem modifica nada no host remoto.

## Detalhes do fluxo local

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha Manter, Modificar ou Redefinir.
    - Reexecutar o assistente não apaga nada, a menos que você escolha explicitamente Redefinir (ou passe `--reset`).
    - `--reset` na CLI usa por padrão `config+creds+sessions`; use `--reset-scope full` para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente interrompe e pede que você execute `openclaw doctor` antes de continuar.
    - Redefinir usa `trash` e oferece escopos:
      - Apenas configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o workspace)
  </Step>
  <Step title="Modelo e autenticação">
    - A matriz completa de opções está em [Opções de autenticação e modelo](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Inicializa os arquivos de workspace necessários para o ritual de bootstrap da primeira execução.
    - Layout do workspace: [Workspace do agente](/pt-BR/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Solicita porta, bind, modo de autenticação e exposição via tailscale.
    - Recomendado: mantenha a autenticação por token habilitada mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Use SecretRef** (opt-in)
    - No modo password, a configuração interativa também oferece armazenamento em texto simples ou SecretRef.
    - Caminho SecretRef de token no modo não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desabilite a autenticação apenas se você confiar totalmente em todos os processos locais.
    - Binds sem loopback ainda exigem autenticação.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR
    - [Telegram](/pt-BR/channels/telegram): token de bot
    - [Discord](/pt-BR/channels/discord): token de bot
    - [Google Chat](/pt-BR/channels/googlechat): JSON de service account + audience de Webhook
    - [Mattermost](/pt-BR/channels/mattermost): token de bot + Base URL
    - [Signal](/pt-BR/channels/signal): instalação opcional de `signal-cli` + configuração de conta
    - [BlueBubbles](/pt-BR/channels/bluebubbles): recomendado para iMessage; URL do servidor + senha + Webhook
    - [iMessage](/pt-BR/channels/imessage): caminho legado do CLI `imsg` + acesso ao banco de dados
    - Segurança de DM: o padrão é pairing. A primeira DM envia um código; aprove via
      `openclaw pairing approve <channel> <code>` ou use allowlists.
  </Step>
  <Step title="Instalação de daemon">
    - macOS: LaunchAgent
      - Exige sessão de usuário logada; para headless, use um LaunchDaemon personalizado (não incluído).
    - Linux e Windows via WSL2: systemd user unit
      - O assistente tenta `loginctl enable-linger <user>` para que o gateway continue ativo após logout.
      - Pode pedir sudo (grava em `/var/lib/systemd/linger`); ele tenta sem sudo primeiro.
    - Windows nativo: Scheduled Task primeiro
      - Se a criação da tarefa for negada, o OpenClaw usa fallback para um item de login por usuário na pasta Startup e inicia o gateway imediatamente.
      - Scheduled Tasks continuam preferidas porque fornecem melhor status de supervisor.
    - Seleção de runtime: Node (recomendado; obrigatório para WhatsApp e Telegram). Bun não é recomendado.
  </Step>
  <Step title="Verificação de integridade">
    - Inicia o gateway (se necessário) e executa `openclaw health`.
    - `openclaw status --deep` adiciona a probe de integridade do gateway ao vivo à saída de status, incluindo probes de canais quando compatível.
  </Step>
  <Step title="Skills">
    - Lê Skills disponíveis e verifica requisitos.
    - Permite escolher o gerenciador de Node: npm, pnpm ou bun.
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Finalizar">
    - Resumo e próximos passos, incluindo opções para iOS, Android e app macOS.
  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o assistente imprime instruções de encaminhamento de porta SSH para a UI de Controle em vez de abrir um navegador.
Se os assets da UI de Controle estiverem ausentes, o assistente tentará construí-los; o fallback é `pnpm ui:build` (instala automaticamente dependências da UI).
</Note>

## Detalhes do modo remoto

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.

<Info>
O modo remoto não instala nem modifica nada no host remoto.
</Info>

O que você define:

- URL do gateway remoto (`ws://...`)
- Token, se a autenticação do gateway remoto for necessária (recomendado)

<Note>
- Se o gateway for apenas loopback, use tunneling SSH ou um tailnet.
- Dicas de descoberta:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opções de autenticação e modelo

<AccordionGroup>
  <Accordion title="Chave de API da Anthropic">
    Usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave e então a salva para uso pelo daemon.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (OAuth)">
    Fluxo via navegador; cole `code#state`.

    Define `agents.defaults.model` como `openai-codex/gpt-5.5` quando o modelo está ausente ou já é da família OpenAI.

  </Accordion>
  <Accordion title="Assinatura OpenAI Code (pairing de dispositivo)">
    Fluxo de pairing via navegador com um código de dispositivo de curta duração.

    Define `agents.defaults.model` como `openai-codex/gpt-5.5` quando o modelo está ausente ou já é da família OpenAI.

  </Accordion>
  <Accordion title="Chave de API da OpenAI">
    Usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave, depois armazena a credencial em perfis de autenticação.

    Define `agents.defaults.model` como `openai/gpt-5.4` quando o modelo está ausente, é `openai/*` ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Chave de API do xAI (Grok)">
    Solicita `XAI_API_KEY` e configura o xAI como provedor de modelo.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) e permite escolher o catálogo Zen ou Go.
    URL de setup: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chave de API (genérica)">
    Armazena a chave para você.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita account ID, gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    A configuração é gravada automaticamente. O padrão hospedado é `MiniMax-M2.7`; a configuração por chave de API usa
    `minimax/...`, e a configuração por OAuth usa `minimax-portal/...`.
    Mais detalhes: [MiniMax](/pt-BR/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    A configuração é gravada automaticamente para StepFun padrão ou Step Plan em endpoints da China ou globais.
    O padrão atualmente inclui `step-3.5-flash`, e Step Plan também inclui `step-3.5-flash-2603`.
    Mais detalhes: [StepFun](/pt-BR/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatível com Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Mais detalhes: [Synthetic](/pt-BR/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud e modelos abertos locais)">
    Primeiro solicita `Cloud + Local`, `Cloud only` ou `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` com `https://ollama.com`.
    Os modos com host solicitam Base URL (padrão `http://127.0.0.1:11434`), descobrem modelos disponíveis e sugerem padrões.
    `Cloud + Local` também verifica se esse host Ollama está autenticado para acesso em nuvem.
    Mais detalhes: [Ollama](/pt-BR/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    As configurações Moonshot (Kimi K2) e Kimi Coding são gravadas automaticamente.
    Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot).
  </Accordion>
  <Accordion title="Provedor personalizado">
    Funciona com endpoints compatíveis com OpenAI e compatíveis com Anthropic.

    O onboarding interativo oferece as mesmas opções de armazenamento de chave de API dos outros fluxos com chave de API de provedor:
    - **Paste API key now** (texto simples)
    - **Use secret reference** (ref de env ou ref de provedor configurado, com validação de preflight)

    Flags não interativas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; usa fallback para `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; padrão `openai`)

  </Accordion>
  <Accordion title="Skip">
    Deixa a autenticação sem configuração.
  </Accordion>
</AccordionGroup>

Comportamento do modelo:

- Escolha o modelo padrão a partir das opções detectadas ou informe provedor e modelo manualmente.
- Quando o onboarding começa a partir de uma escolha de autenticação de provedor, o seletor de modelo prefere automaticamente
  esse provedor. Para Volcengine e BytePlus, essa mesma preferência
  também corresponde às variantes de coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se esse filtro de provedor preferido ficar vazio, o seletor usa fallback para
  o catálogo completo em vez de não mostrar modelos.
- O assistente executa uma verificação de modelo e avisa se o modelo configurado for desconhecido ou estiver sem autenticação.

Caminhos de credenciais e perfis:

- Perfis de autenticação (chaves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importação legada de OAuth: `~/.openclaw/credentials/oauth.json`

Modo de armazenamento de credenciais:

- O comportamento padrão do onboarding persiste chaves de API como valores em texto simples em perfis de autenticação.
- `--secret-input-mode ref` habilita o modo de referência em vez de armazenamento em texto simples da chave.
  Na configuração interativa, você pode escolher:
  - ref de variável de ambiente (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ref de provedor configurado (`file` ou `exec`) com alias de provedor + id
- O modo interativo de referência executa uma validação rápida de preflight antes de salvar.
  - Refs de env: valida o nome da variável e se o valor não está vazio no ambiente atual do onboarding.
  - Refs de provedor: valida a configuração do provedor e resolve o id solicitado.
  - Se o preflight falhar, o onboarding mostra o erro e permite tentar novamente.
- No modo não interativo, `--secret-input-mode ref` é apenas com suporte de env.
  - Defina a variável de ambiente do provedor no ambiente do processo de onboarding.
  - Flags de chave inline (por exemplo `--openai-api-key`) exigem que essa variável de ambiente esteja definida; caso contrário, o onboarding falha imediatamente.
  - Para provedores personalizados, o modo `ref` não interativo armazena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Nesse caso de provedor personalizado, `--custom-api-key` exige que `CUSTOM_API_KEY` esteja definido; caso contrário, o onboarding falha imediatamente.
- Credenciais de autenticação do gateway oferecem suporte a texto simples e escolhas SecretRef na configuração interativa:
  - Modo token: **Generate/store plaintext token** (padrão) ou **Use SecretRef**.
  - Modo password: texto simples ou SecretRef.
- Caminho SecretRef de token no modo não interativo: `--gateway-token-ref-env <ENV_VAR>`.
- Configurações existentes em texto simples continuam funcionando sem alteração.

<Note>
Dica para ambientes headless e servidores: conclua o OAuth em uma máquina com navegador e depois copie
o `auth-profiles.json` desse agente (por exemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente
`$OPENCLAW_STATE_DIR/...`) para o host do gateway. `credentials/oauth.json`
é apenas uma fonte legada de importação.
</Note>

## Saídas e internals

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se MiniMax for escolhido)
- `tools.profile` (o onboarding local usa por padrão `"coding"` quando ausente; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, tailscale)
- `session.dmScope` (o onboarding local usa por padrão `per-channel-peer` quando ausente; valores explícitos existentes são preservados)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack, Discord, Matrix, Microsoft Teams) quando você faz opt-in durante os prompts (nomes são resolvidos para IDs quando possível)
- `skills.install.nodeManager`
  - A flag `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A configuração manual ainda pode definir `skills.install.nodeManager: "yarn"` depois.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` grava `agents.list[]` e `bindings` opcionais.

Credenciais do WhatsApp ficam em `~/.openclaw/credentials/whatsapp/<accountId>/`.
As sessões são armazenadas em `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alguns canais são entregues como plugins. Quando selecionados durante a configuração, o assistente
solicita a instalação do plugin (npm ou caminho local) antes da configuração do canal.
</Note>

RPC do assistente do Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clientes (app macOS e UI de Controle) podem renderizar etapas sem reimplementar a lógica de onboarding.

Comportamento de configuração do Signal:

- Baixa o asset de release apropriado
- Armazena em `~/.openclaw/tools/signal-cli/<version>/`
- Grava `channels.signal.cliPath` na configuração
- Builds JVM exigem Java 21
- Builds nativas são usadas quando disponíveis
- O Windows usa WSL2 e segue o fluxo Linux de signal-cli dentro do WSL

## Documentação relacionada

- Hub de onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Automação e scripts: [Automação da CLI](/pt-BR/start/wizard-cli-automation)
- Referência de comando: [`openclaw onboard`](/pt-BR/cli/onboard)
