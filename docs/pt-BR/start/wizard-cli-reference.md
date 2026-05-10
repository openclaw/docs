---
read_when:
    - Você precisa de comportamento detalhado para openclaw onboard
    - Você está depurando resultados da integração inicial ou integrando clientes de integração inicial
sidebarTitle: CLI reference
summary: Referência completa para o fluxo de configuração da CLI, configuração de autenticação/modelo, saídas e componentes internos
title: Referência de configuração da CLI
x-i18n:
    generated_at: "2026-05-10T19:50:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Esta página é a referência completa para `openclaw onboard`.
Para o guia curto, consulte [Integração (CLI)](/pt-BR/start/wizard).

## O que o assistente faz

O modo local (padrão) orienta você por:

- Configuração de modelo e autenticação (OAuth da assinatura OpenAI Code, CLI Anthropic Claude ou chave de API, além de opções MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Local do workspace e arquivos de bootstrap
- Configurações do Gateway (porta, bind, autenticação, tailscale)
- Canais e provedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage e outros plugins de canal incluídos)
- Instalação do daemon (LaunchAgent, unidade systemd de usuário ou Tarefa Agendada nativa do Windows com fallback para a pasta Inicializar)
- Verificação de integridade
- Configuração de Skills

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.
Ele não instala nem modifica nada no host remoto.

## Detalhes do fluxo local

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha Manter, Modificar ou Redefinir.
    - Executar o assistente novamente não apaga nada, a menos que você escolha Redefinir explicitamente (ou passe `--reset`).
    - O padrão de `--reset` da CLI é `config+creds+sessions`; use `--reset-scope full` para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e pede que você execute `openclaw doctor` antes de continuar.
    - A redefinição usa `trash` e oferece escopos:
      - Somente configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o workspace)

  </Step>
  <Step title="Modelo e autenticação">
    - A matriz completa de opções está em [Opções de autenticação e modelo](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Inicializa os arquivos do workspace necessários para o ritual de bootstrap da primeira execução.
    - Layout do workspace: [Workspace do agente](/pt-BR/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Solicita porta, bind, modo de autenticação e exposição por tailscale.
    - Recomendado: mantenha a autenticação por token habilitada mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
    - No modo senha, a configuração interativa também oferece suporte a armazenamento em texto simples ou SecretRef.
    - Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de integração.
      - Não pode ser combinado com `--gateway-token`.
    - Desabilite a autenticação somente se você confiar totalmente em todos os processos locais.
    - Binds fora de loopback ainda exigem autenticação.

  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login por QR opcional
    - [Telegram](/pt-BR/channels/telegram): token do bot
    - [Discord](/pt-BR/channels/discord): token do bot
    - [Google Chat](/pt-BR/channels/googlechat): JSON de conta de serviço + público do webhook
    - [Mattermost](/pt-BR/channels/mattermost): token do bot + URL base
    - [Signal](/pt-BR/channels/signal): instalação opcional do `signal-cli` + configuração da conta
    - [iMessage](/pt-BR/channels/imessage): caminho da CLI `imsg` + acesso ao banco de dados do Messages; use um wrapper SSH quando o Gateway for executado fora do Mac
    - Segurança de DM: o padrão é pareamento. A primeira DM envia um código; aprove via
      `openclaw pairing approve <channel> <code>` ou use allowlists.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Exige sessão de usuário conectada; para headless, use um LaunchDaemon personalizado (não distribuído).
    - Linux e Windows via WSL2: unidade systemd de usuário
      - O assistente tenta `loginctl enable-linger <user>` para que o gateway permaneça ativo após o logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); ele tenta sem sudo primeiro.
    - Windows nativo: Tarefa Agendada primeiro
      - Se a criação da tarefa for negada, o OpenClaw faz fallback para um item de login por usuário na pasta Inicializar e inicia o gateway imediatamente.
      - Tarefas Agendadas continuam preferidas porque fornecem melhor status de supervisor.
    - Seleção de runtime: Node (recomendado; obrigatório para WhatsApp e Telegram). Bun não é recomendado.

  </Step>
  <Step title="Verificação de integridade">
    - Inicia o gateway (se necessário) e executa `openclaw health`.
    - `openclaw status --deep` adiciona a sondagem de integridade do gateway ativo à saída de status, incluindo sondagens de canal quando houver suporte.

  </Step>
  <Step title="Skills">
    - Lê as Skills disponíveis e verifica requisitos.
    - Permite escolher o gerenciador de node: npm, pnpm ou bun.
    - Instala dependências opcionais (algumas usam Homebrew no macOS).

  </Step>
  <Step title="Finalizar">
    - Resumo e próximos passos, incluindo opções de app para iOS, Android e macOS.

  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o assistente imprime instruções de encaminhamento de porta SSH para a UI de controle em vez de abrir um navegador.
Se os assets da UI de controle estiverem ausentes, o assistente tenta compilá-los; o fallback é `pnpm ui:build` (instala automaticamente as dependências da UI).
</Note>

## Detalhes do modo remoto

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.

<Info>
O modo remoto não instala nem modifica nada no host remoto.
</Info>

O que você define:

- URL do gateway remoto (`ws://...`)
- Token se a autenticação do gateway remoto for necessária (recomendado)

<Note>
- Se o gateway for apenas loopback, use tunelamento SSH ou uma tailnet.
- Dicas de descoberta:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opções de autenticação e modelo

<AccordionGroup>
  <Accordion title="Chave de API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente ou solicita uma chave, depois a salva para uso pelo daemon.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (OAuth)">
    Fluxo pelo navegador; cole `code#state`.

    Define `agents.defaults.model` como `openai/gpt-5.5` por meio do runtime Codex quando o modelo não está definido ou já é da família OpenAI.

  </Accordion>
  <Accordion title="Assinatura OpenAI Code (pareamento de dispositivo)">
    Fluxo de pareamento pelo navegador com um código de dispositivo de curta duração.

    Define `agents.defaults.model` como `openai/gpt-5.5` por meio do runtime Codex quando o modelo não está definido ou já é da família OpenAI.

  </Accordion>
  <Accordion title="Chave de API OpenAI">
    Usa `OPENAI_API_KEY` se presente ou solicita uma chave, depois armazena a credencial nos perfis de autenticação.

    Define `agents.defaults.model` como `openai/gpt-5.5` quando o modelo não está definido, `openai/*` ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Chave de API xAI (Grok)">
    Solicita `XAI_API_KEY` e configura xAI como provedor de modelo.
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
    Solicita ID da conta, ID do gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    A configuração é gravada automaticamente. O padrão hospedado é `MiniMax-M2.7`; a configuração com chave de API usa
    `minimax/...`, e a configuração OAuth usa `minimax-portal/...`.
    Mais detalhes: [MiniMax](/pt-BR/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    A configuração é gravada automaticamente para StepFun standard ou Step Plan em endpoints da China ou globais.
    Standard atualmente inclui `step-3.5-flash`, e Step Plan também inclui `step-3.5-flash-2603`.
    Mais detalhes: [StepFun](/pt-BR/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatível com Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Mais detalhes: [Synthetic](/pt-BR/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud e modelos abertos locais)">
    Solicita primeiro `Cloud + Local`, `Cloud only` ou `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` com `https://ollama.com`.
    Os modos apoiados por host solicitam a URL base (padrão `http://127.0.0.1:11434`), descobrem modelos disponíveis e sugerem padrões.
    `Cloud + Local` também verifica se esse host Ollama está conectado para acesso à nuvem.
    Mais detalhes: [Ollama](/pt-BR/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    As configurações Moonshot (Kimi K2) e Kimi Coding são gravadas automaticamente.
    Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot).
  </Accordion>
  <Accordion title="Provedor personalizado">
    Funciona com endpoints compatíveis com OpenAI e compatíveis com Anthropic.

    A integração interativa oferece suporte às mesmas opções de armazenamento de chave de API que outros fluxos de chave de API de provedor:
    - **Colar chave de API agora** (texto simples)
    - **Usar referência secreta** (ref de env ou ref de provedor configurado, com validação prévia)

    Flags não interativas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; usa `CUSTOM_API_KEY` como fallback)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; padrão `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcional; substitui a capacidade inferida de entrada do modelo)

  </Accordion>
  <Accordion title="Pular">
    Deixa a autenticação sem configuração.
  </Accordion>
</AccordionGroup>

Comportamento do modelo:

- Escolha o modelo padrão a partir das opções detectadas ou insira provedor e modelo manualmente.
- A integração de provedor personalizado infere suporte a imagem para IDs de modelo comuns e pergunta somente quando o nome do modelo é desconhecido.
- Quando a integração começa a partir de uma opção de autenticação de provedor, o seletor de modelo prefere
  esse provedor automaticamente. Para Volcengine e BytePlus, a mesma preferência
  também corresponde às suas variantes de plano de codificação (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se esse filtro de provedor preferido ficar vazio, o seletor faz fallback para
  o catálogo completo em vez de não mostrar modelos.
- O assistente executa uma verificação de modelo e avisa se o modelo configurado é desconhecido ou não tem autenticação.

Caminhos de credenciais e perfis:

- Perfis de autenticação (chaves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importação OAuth legada: `~/.openclaw/credentials/oauth.json`

Modo de armazenamento de credenciais:

- O comportamento padrão da integração persiste chaves de API como valores em texto simples nos perfis de autenticação.
- `--secret-input-mode ref` habilita o modo de referência em vez do armazenamento de chave em texto simples.
  Na configuração interativa, você pode escolher:
  - ref de variável de ambiente (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ref de provedor configurado (`file` ou `exec`) com alias do provedor + id
- O modo de referência interativo executa uma validação prévia rápida antes de salvar.
  - Refs de env: valida nome da variável + valor não vazio no ambiente atual da integração.
  - Refs de provedor: valida a configuração do provedor e resolve o id solicitado.
  - Se a validação prévia falhar, a integração mostra o erro e permite tentar novamente.
- No modo não interativo, `--secret-input-mode ref` é apoiado somente por env.
  - Defina a variável de ambiente do provedor no ambiente do processo de integração.
  - Flags de chave inline (por exemplo `--openai-api-key`) exigem que essa variável de ambiente esteja definida; caso contrário, a integração falha rapidamente.
  - Para provedores personalizados, o modo `ref` não interativo armazena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Nesse caso de provedor personalizado, `--custom-api-key` exige que `CUSTOM_API_KEY` esteja definido; caso contrário, a integração falha rapidamente.
- Credenciais de autenticação do Gateway oferecem suporte a opções de texto simples e SecretRef na configuração interativa:
  - Modo token: **Gerar/armazenar token em texto simples** (padrão) ou **Usar SecretRef**.
  - Modo senha: texto simples ou SecretRef.
- Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
- Configurações existentes em texto simples continuam funcionando sem alterações.

<Note>
Dica para uso headless e em servidor: conclua o OAuth em uma máquina com navegador e depois copie
o `auth-profiles.json` desse agente (por exemplo,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente em
`$OPENCLAW_STATE_DIR/...`) para o host do Gateway. `credentials/oauth.json`
é apenas uma fonte de importação legada.
</Note>

## Saídas e componentes internos

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando `--skip-bootstrap` é passado
- `agents.defaults.model` / `models.providers` (se Minimax for escolhido)
- `tools.profile` (o onboarding local usa `"coding"` por padrão quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (o onboarding local define isso como `per-channel-peer` por padrão quando não definido; valores explícitos existentes são preservados)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissão de canais (Slack, Discord, Matrix, Microsoft Teams) quando você opta por usá-las durante os prompts (nomes são resolvidos para IDs quando possível)
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
Sessões são armazenadas em `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alguns canais são entregues como plugins. Quando selecionados durante a configuração, o assistente
solicita a instalação do plugin (npm ou caminho local) antes da configuração do canal.
</Note>

RPC do assistente do Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clientes (app macOS e Control UI) podem renderizar etapas sem reimplementar a lógica de onboarding.

Comportamento da configuração do Signal:

- Baixa o asset de release apropriado
- Armazena-o em `~/.openclaw/tools/signal-cli/<version>/`
- Grava `channels.signal.cliPath` na configuração
- Builds da JVM exigem Java 21
- Builds nativas são usadas quando disponíveis
- Windows usa WSL2 e segue o fluxo do signal-cli para Linux dentro do WSL

## Documentos relacionados

- Hub de onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Automação e scripts: [Automação da CLI](/pt-BR/start/wizard-cli-automation)
- Referência de comandos: [`openclaw onboard`](/pt-BR/cli/onboard)
