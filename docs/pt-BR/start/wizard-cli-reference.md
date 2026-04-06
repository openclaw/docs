---
read_when:
    - Você precisa do comportamento detalhado de `openclaw onboard`
    - Você está depurando resultados de onboarding ou integrando clientes de onboarding
sidebarTitle: CLI reference
summary: Referência completa do fluxo de configuração da CLI, configuração de auth/modelo, saídas e internals
title: Referência de configuração da CLI
x-i18n:
    generated_at: "2026-04-06T03:12:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92f379b34a2b48c68335dae4f759117c770f018ec51b275f4f40421c6b3abb23
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Referência de configuração da CLI

Esta página é a referência completa para `openclaw onboard`.
Para o guia curto, consulte [Onboarding (CLI)](/pt-BR/start/wizard).

## O que o assistente faz

O modo local (padrão) orienta você em:

- Configuração de modelo e auth (OAuth de assinatura do OpenAI Code, Anthropic Claude CLI ou chave de API, além de opções para MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Local do workspace e arquivos de bootstrap
- Configurações do gateway (porta, bind, auth, tailscale)
- Canais e providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles e outros plugins de canal empacotados)
- Instalação como daemon (LaunchAgent, unit de usuário do systemd ou Scheduled Task nativa do Windows com fallback para a pasta Startup)
- Verificação de integridade
- Configuração de Skills

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.
Ele não instala nem modifica nada no host remoto.

## Detalhes do fluxo local

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha Manter, Modificar ou Redefinir.
    - Executar o assistente novamente não apaga nada, a menos que você escolha explicitamente Redefinir (ou passe `--reset`).
    - `--reset` na CLI usa por padrão `config+creds+sessions`; use `--reset-scope full` para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e pede que você execute `openclaw doctor` antes de continuar.
    - A redefinição usa `trash` e oferece os escopos:
      - Apenas configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o workspace)
  </Step>
  <Step title="Modelo e auth">
    - A matriz completa de opções está em [Opções de auth e modelo](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Preenche os arquivos do workspace necessários para o ritual de bootstrap da primeira execução.
    - Layout do workspace: [Workspace do agente](/pt-BR/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Solicita porta, bind, modo de auth e exposição via tailscale.
    - Recomendado: manter a auth por token habilitada mesmo para loopback para que clientes WS locais precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
    - No modo senha, a configuração interativa também oferece armazenamento em texto simples ou SecretRef.
    - Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desabilite a auth apenas se você confiar totalmente em todos os processos locais.
    - Binds fora de loopback ainda exigem auth.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login por QR opcional
    - [Telegram](/pt-BR/channels/telegram): token de bot
    - [Discord](/pt-BR/channels/discord): token de bot
    - [Google Chat](/pt-BR/channels/googlechat): JSON de conta de serviço + audience de webhook
    - [Mattermost](/pt-BR/channels/mattermost): token de bot + URL base
    - [Signal](/pt-BR/channels/signal): instalação opcional do `signal-cli` + configuração da conta
    - [BlueBubbles](/pt-BR/channels/bluebubbles): recomendado para iMessage; URL do servidor + senha + webhook
    - [iMessage](/pt-BR/channels/imessage): caminho legado da CLI `imsg` + acesso ao DB
    - Segurança de DM: o padrão é pareamento. A primeira DM envia um código; aprove via
      `openclaw pairing approve <channel> <code>` ou use allowlists.
  </Step>
  <Step title="Instalação como daemon">
    - macOS: LaunchAgent
      - Exige uma sessão de usuário conectada; para modo headless, use um LaunchDaemon personalizado (não fornecido).
    - Linux e Windows via WSL2: unit de usuário do systemd
      - O assistente tenta `loginctl enable-linger <user>` para que o gateway continue em execução após logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); ele tenta primeiro sem sudo.
    - Windows nativo: Scheduled Task primeiro
      - Se a criação da tarefa for negada, o OpenClaw usa fallback para um item de login por usuário na pasta Startup e inicia o gateway imediatamente.
      - Scheduled Tasks continuam sendo preferidas porque fornecem melhor status do supervisor.
    - Seleção de runtime: Node (recomendado; obrigatório para WhatsApp e Telegram). Bun não é recomendado.
  </Step>
  <Step title="Verificação de integridade">
    - Inicia o gateway (se necessário) e executa `openclaw health`.
    - `openclaw status --deep` adiciona a sonda de integridade do gateway em tempo real à saída de status, incluindo sondas de canal quando compatível.
  </Step>
  <Step title="Skills">
    - Lê as Skills disponíveis e verifica os requisitos.
    - Permite escolher o gerenciador de Node: npm, pnpm ou bun.
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Finalizar">
    - Resumo e próximos passos, incluindo opções de app para iOS, Android e macOS.
  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o assistente imprime instruções de encaminhamento de porta SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o assistente tenta compilá-los; o fallback é `pnpm ui:build` (instala automaticamente as dependências da UI).
</Note>

## Detalhes do modo remoto

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.

<Info>
O modo remoto não instala nem modifica nada no host remoto.
</Info>

O que você define:

- URL do gateway remoto (`ws://...`)
- Token se a auth do gateway remoto for necessária (recomendado)

<Note>
- Se o gateway estiver acessível apenas por loopback, use tunelamento SSH ou uma tailnet.
- Dicas de descoberta:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opções de auth e modelo

<AccordionGroup>
  <Accordion title="Chave de API da Anthropic">
    Usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave, depois a salva para uso pelo daemon.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (reutilização da CLI do Codex)">
    Se `~/.codex/auth.json` existir, o assistente poderá reutilizá-lo.
    As credenciais reutilizadas da CLI do Codex continuam sendo gerenciadas pela própria CLI do Codex; ao expirar, o OpenClaw
    relê essa fonte primeiro e, quando o provider consegue renová-la, grava
    a credencial renovada de volta no armazenamento do Codex em vez de assumir
    sua posse.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (OAuth)">
    Fluxo no navegador; cole `code#state`.

    Define `agents.defaults.model` como `openai-codex/gpt-5.4` quando o modelo estiver indefinido ou for `openai/*`.

  </Accordion>
  <Accordion title="Chave de API da OpenAI">
    Usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave, depois armazena a credencial em perfis de auth.

    Define `agents.defaults.model` como `openai/gpt-5.4` quando o modelo estiver indefinido, for `openai/*` ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Chave de API do xAI (Grok)">
    Solicita `XAI_API_KEY` e configura xAI como provider de modelo.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) e permite escolher o catálogo Zen ou Go.
    URL de configuração: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chave de API (genérica)">
    Armazena a chave para você.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita o ID da conta, o ID do gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    A configuração é gravada automaticamente. O padrão hospedado é `MiniMax-M2.7`; a configuração com chave de API usa
    `minimax/...`, e a configuração com OAuth usa `minimax-portal/...`.
    Mais detalhes: [MiniMax](/pt-BR/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    A configuração é gravada automaticamente para StepFun standard ou Step Plan em endpoints da China ou globais.
    Atualmente, Standard inclui `step-3.5-flash`, e Step Plan também inclui `step-3.5-flash-2603`.
    Mais detalhes: [StepFun](/pt-BR/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatível com Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Mais detalhes: [Synthetic](/pt-BR/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud e modelos abertos locais)">
    Solicita a URL base (padrão `http://127.0.0.1:11434`), depois oferece os modos Cloud + Local ou Local.
    Descobre os modelos disponíveis e sugere padrões.
    Mais detalhes: [Ollama](/pt-BR/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    As configurações do Moonshot (Kimi K2) e Kimi Coding são gravadas automaticamente.
    Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personalizado">
    Funciona com endpoints compatíveis com OpenAI e compatíveis com Anthropic.

    O onboarding interativo oferece as mesmas opções de armazenamento de chave de API que outros fluxos de chave de API de provider:
    - **Colar chave de API agora** (texto simples)
    - **Usar referência secreta** (referência env ou referência de provider configurado, com validação prévia)

    Flags não interativas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; usa `CUSTOM_API_KEY` como fallback)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; padrão `openai`)

  </Accordion>
  <Accordion title="Ignorar">
    Deixa a auth sem configuração.
  </Accordion>
</AccordionGroup>

Comportamento do modelo:

- Escolha o modelo padrão entre as opções detectadas, ou informe manualmente o provider e o modelo.
- Quando o onboarding começa a partir de uma escolha de auth de provider, o seletor de modelos passa a priorizar
  esse provider automaticamente. Para Volcengine e BytePlus, a mesma preferência
  também corresponde às variantes de plano de codificação (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se esse filtro de provider preferido ficar vazio, o seletor volta para
  o catálogo completo em vez de mostrar nenhum modelo.
- O assistente executa uma verificação do modelo e avisa se o modelo configurado for desconhecido ou estiver sem auth.

Caminhos de credenciais e perfis:

- Perfis de auth (chaves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importação legada de OAuth: `~/.openclaw/credentials/oauth.json`

Modo de armazenamento de credenciais:

- O comportamento padrão do onboarding persiste chaves de API como valores em texto simples nos perfis de auth.
- `--secret-input-mode ref` habilita o modo de referência em vez do armazenamento em texto simples da chave.
  Na configuração interativa, você pode escolher:
  - referência de variável de ambiente (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referência de provider configurado (`file` ou `exec`) com alias do provider + id
- O modo interativo por referência executa uma validação prévia rápida antes de salvar.
  - Referências env: valida o nome da variável + valor não vazio no ambiente atual do onboarding.
  - Referências de provider: valida a configuração do provider e resolve o id solicitado.
  - Se a validação prévia falhar, o onboarding mostra o erro e permite que você tente novamente.
- No modo não interativo, `--secret-input-mode ref` é apenas baseado em env.
  - Defina a variável de ambiente do provider no ambiente do processo de onboarding.
  - Flags de chave inline (por exemplo `--openai-api-key`) exigem que essa variável de env esteja definida; caso contrário, o onboarding falha imediatamente.
  - Para providers personalizados, o modo `ref` não interativo armazena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Nesse caso de provider personalizado, `--custom-api-key` exige que `CUSTOM_API_KEY` esteja definido; caso contrário, o onboarding falha imediatamente.
- Credenciais de auth do gateway oferecem opções de texto simples e SecretRef na configuração interativa:
  - Modo token: **Gerar/armazenar token em texto simples** (padrão) ou **Usar SecretRef**.
  - Modo senha: texto simples ou SecretRef.
- Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
- Configurações existentes em texto simples continuam funcionando sem mudanças.

<Note>
Dica para ambientes headless e servidores: conclua o OAuth em uma máquina com navegador e depois copie
o `auth-profiles.json` desse agente (por exemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente em
`$OPENCLAW_STATE_DIR/...`) para o host do gateway. `credentials/oauth.json`
é apenas uma fonte legada de importação.
</Note>

## Saídas e internals

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se MiniMax for escolhido)
- `tools.profile` (o onboarding local usa por padrão `"coding"` quando não está definido; valores explícitos existentes são preservados)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (o onboarding local usa por padrão `per-channel-peer` quando não está definido; valores explícitos existentes são preservados)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack, Discord, Matrix, Microsoft Teams) quando você opta por isso durante os prompts (nomes são resolvidos para IDs quando possível)
- `skills.install.nodeManager`
  - A flag `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A configuração manual ainda pode definir `skills.install.nodeManager: "yarn"` depois.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` grava `agents.list[]` e `bindings` opcionais.

As credenciais do WhatsApp ficam em `~/.openclaw/credentials/whatsapp/<accountId>/`.
As sessões são armazenadas em `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alguns canais são entregues como plugins. Quando selecionados durante a configuração, o assistente
solicita a instalação do plugin (npm ou caminho local) antes da configuração do canal.
</Note>

RPC do assistente do gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clientes (app do macOS e Control UI) podem renderizar etapas sem reimplementar a lógica de onboarding.

Comportamento da configuração do Signal:

- Baixa o asset de release apropriado
- Armazena em `~/.openclaw/tools/signal-cli/<version>/`
- Grava `channels.signal.cliPath` na configuração
- Builds JVM exigem Java 21
- Builds nativas são usadas quando disponíveis
- O Windows usa WSL2 e segue o fluxo Linux do signal-cli dentro do WSL

## Documentação relacionada

- Hub de onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Automação e scripts: [Automação da CLI](/pt-BR/start/wizard-cli-automation)
- Referência de comando: [`openclaw onboard`](/cli/onboard)
