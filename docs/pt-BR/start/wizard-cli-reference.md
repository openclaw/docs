---
read_when:
    - Você precisa do comportamento detalhado de openclaw onboard
    - Você está depurando resultados de integração inicial ou integrando clientes de integração inicial
sidebarTitle: CLI reference
summary: Referência completa para o fluxo de configuração da CLI, configuração de autenticação/modelo, saídas e aspectos internos
title: Referência de configuração da CLI
x-i18n:
    generated_at: "2026-07-04T06:26:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Esta página é a referência completa de `openclaw onboard`.
Para o guia curto, consulte [Integração (CLI)](/pt-BR/start/wizard).

## O que o assistente faz

O modo local (padrão) orienta você por:

- Configuração de modelo e autenticação (OAuth da assinatura OpenAI Code, CLI ou chave de API do Anthropic Claude, além de opções MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Local do workspace e arquivos de inicialização
- Configurações do Gateway (porta, bind, autenticação, tailscale)
- Canais e provedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage e outros plugins de canal incluídos)
- Instalação do daemon (LaunchAgent, unidade de usuário systemd ou Windows Scheduled Task nativo com fallback para a pasta Startup)
- Verificação de integridade
- Configuração de Skills

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.
Ele não instala nem modifica nada no host remoto.

## Detalhes do fluxo local

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha Manter, Modificar ou Redefinir.
    - Executar o assistente novamente não apaga nada, a menos que você escolha explicitamente Redefinir (ou passe `--reset`).
    - CLI `--reset` usa `config+creds+sessions` por padrão; use `--reset-scope full` para também remover o workspace.
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
    - Preenche os arquivos do workspace necessários para o ritual de bootstrap da primeira execução.
    - Layout do workspace: [Workspace do agente](/pt-BR/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Solicita porta, bind, modo de autenticação e exposição tailscale.
    - Recomendado: mantenha a autenticação por token ativada mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo de token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
    - No modo de senha, a configuração interativa também oferece suporte a armazenamento em texto simples ou SecretRef.
    - Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Requer uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a autenticação somente se você confiar totalmente em todos os processos locais.
    - Binds que não são local loopback ainda exigem autenticação.

  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR
    - [Telegram](/pt-BR/channels/telegram): token de bot
    - [Discord](/pt-BR/channels/discord): token de bot
    - [Google Chat](/pt-BR/channels/googlechat): JSON de conta de serviço + público do webhook
    - [Mattermost](/pt-BR/channels/mattermost): token de bot + URL base
    - [Signal](/pt-BR/channels/signal): instalação opcional de `signal-cli` + configuração da conta
    - [iMessage](/pt-BR/channels/imessage): caminho da CLI `imsg` + acesso ao banco de dados Messages; use um wrapper SSH quando o Gateway rodar fora do Mac
    - Segurança de DM: o padrão é pareamento. A primeira DM envia um código; aprove via
      `openclaw pairing approve <channel> <code>` ou use listas de permissões.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Requer sessão de usuário conectada; para headless, use um LaunchDaemon personalizado (não incluído).
    - Linux e Windows via WSL2: unidade de usuário systemd
      - O assistente tenta `loginctl enable-linger <user>` para que o gateway continue ativo após o logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); ele tenta sem sudo primeiro.
    - Windows nativo: Scheduled Task primeiro
      - Se a criação da tarefa for negada, o OpenClaw faz fallback para um item de login por usuário na pasta Startup e inicia o gateway imediatamente.
      - Scheduled Tasks continuam sendo preferidas porque fornecem melhor status de supervisor.
    - Seleção de runtime: Node (recomendado; obrigatório para WhatsApp e Telegram). Bun não é recomendado.

  </Step>
  <Step title="Verificação de integridade">
    - Inicia o gateway (se necessário) e executa `openclaw health`.
    - `openclaw status --deep` adiciona a sondagem de integridade do gateway ativo à saída de status, incluindo sondagens de canal quando houver suporte.

  </Step>
  <Step title="Skills">
    - Lê as skills disponíveis e verifica requisitos.
    - Permite escolher o gerenciador de node: npm, pnpm ou bun.
    - Instala dependências opcionais para skills incluídas confiáveis quando o instalador necessário está disponível.
    - Ignora instaladores Homebrew, uv e Go indisponíveis e agrupa as skills afetadas com orientação de configuração manual. Execute `openclaw doctor` depois de instalar os pré-requisitos ausentes.

  </Step>
  <Step title="Concluir">
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
- Token se a autenticação do gateway remoto for obrigatória (recomendado)

<Note>
- Se o gateway for apenas local loopback, use tunelamento SSH ou uma tailnet.
- Dicas de descoberta:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opções de autenticação e modelo

<AccordionGroup>
  <Accordion title="Chave de API Anthropic">
    Usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave e depois a salva para uso pelo daemon.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (OAuth)">
    Fluxo pelo navegador; cole `code#state`.

    Define `agents.defaults.model` como `openai/gpt-5.5` por meio do runtime Codex quando o modelo não está definido ou já pertence à família OpenAI.

  </Accordion>
  <Accordion title="Assinatura OpenAI Code (pareamento de dispositivo)">
    Fluxo de pareamento pelo navegador com um código de dispositivo de curta duração.

    Define `agents.defaults.model` como `openai/gpt-5.5` por meio do runtime Codex quando o modelo não está definido ou já pertence à família OpenAI.

  </Accordion>
  <Accordion title="Chave de API OpenAI">
    Usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave e depois armazena a credencial em perfis de autenticação.

    Define `agents.defaults.model` como `openai/gpt-5.5` quando o modelo não está definido, é `openai/*` ou referências de modelo Codex legadas.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Login pelo navegador para contas SuperGrok ou X Premium qualificadas. Este é o caminho xAI recomendado para a maioria dos usuários. O OpenClaw armazena o perfil de autenticação resultante para modelos Grok, Grok `web_search`, `x_search` e `code_execution`.
  </Accordion>
  <Accordion title="Código de dispositivo xAI (Grok)">
    Login pelo navegador adequado para remoto com um código curto em vez de um callback localhost. Use isto a partir de hosts SSH, Docker ou VPS.
  </Accordion>
  <Accordion title="Chave de API xAI (Grok)">
    Solicita `XAI_API_KEY` e configura xAI como provedor de modelo. Use isto quando quiser uma chave de API do xAI Console em vez de OAuth de assinatura.
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
    A configuração é gravada automaticamente. O padrão hospedado é `MiniMax-M3`; a configuração com chave de API usa `minimax/...`, e a configuração OAuth usa `minimax-portal/...`.
    Mais detalhes: [MiniMax](/pt-BR/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    A configuração é gravada automaticamente para o StepFun standard ou Step Plan em endpoints da China ou globais.
    O padrão atualmente inclui `step-3.5-flash`, e o Step Plan também inclui `step-3.5-flash-2603`.
    Mais detalhes: [StepFun](/pt-BR/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatível com Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Mais detalhes: [Synthetic](/pt-BR/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abertos em Cloud e locais)">
    Solicita primeiro `Cloud + Local`, `Cloud only` ou `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` com `https://ollama.com`.
    Os modos respaldados por host solicitam a URL base (padrão `http://127.0.0.1:11434`), descobrem modelos disponíveis e sugerem padrões.
    `Cloud + Local` também verifica se esse host Ollama está conectado para acesso à cloud.
    Mais detalhes: [Ollama](/pt-BR/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    As configurações Moonshot (Kimi K2) e Kimi Coding são gravadas automaticamente.
    Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot).
  </Accordion>
  <Accordion title="Provedor personalizado">
    Funciona com endpoints compatíveis com OpenAI e compatíveis com Anthropic.

    O onboarding interativo oferece suporte às mesmas opções de armazenamento de chave de API que outros fluxos de chave de API de provedor:
    - **Colar chave de API agora** (texto simples)
    - **Usar referência secreta** (referência de env ou referência de provedor configurada, com validação de preflight)

    Flags não interativas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; faz fallback para `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcional; padrão `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcional; substitui a capacidade inferida de entrada do modelo)

  </Accordion>
  <Accordion title="Pular">
    Deixa a autenticação não configurada.
  </Accordion>
</AccordionGroup>

Comportamento do modelo:

- Escolha o modelo padrão entre as opções detectadas ou informe o provedor e o modelo manualmente.
- O onboarding de provedor personalizado infere suporte a imagem para IDs de modelo comuns e pergunta apenas quando o nome do modelo é desconhecido.
- Quando o onboarding começa a partir de uma escolha de autenticação de provedor, o seletor de modelo prefere esse provedor automaticamente. Para Volcengine e BytePlus, a mesma preferência também corresponde às variantes de plano de codificação deles (`volcengine-plan/*`, `byteplus-plan/*`).
- Se esse filtro de provedor preferido ficaria vazio, o seletor faz fallback para o catálogo completo em vez de não mostrar modelos.
- O assistente executa uma verificação de modelo e avisa se o modelo configurado é desconhecido ou está sem autenticação.

Caminhos de credenciais e perfis:

- Perfis de autenticação (chaves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importação de OAuth legada: `~/.openclaw/credentials/oauth.json`

Modo de armazenamento de credenciais:

- O comportamento padrão de onboarding persiste chaves de API como valores em texto simples nos perfis de autenticação.
- `--secret-input-mode ref` ativa o modo de referência em vez do armazenamento de chaves em texto simples.
  Na configuração interativa, você pode escolher:
  - ref de variável de ambiente (por exemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ref de provedor configurado (`file` ou `exec`) com alias do provedor + id
- O modo de referência interativo executa uma validação rápida de preflight antes de salvar.
  - Refs de env: valida o nome da variável + valor não vazio no ambiente de onboarding atual.
  - Refs de provedor: valida a configuração do provedor e resolve o id solicitado.
  - Se o preflight falhar, o onboarding mostra o erro e permite tentar novamente.
- No modo não interativo, `--secret-input-mode ref` é somente baseado em env.
  - Defina a env var do provedor no ambiente do processo de onboarding.
  - Flags de chave inline (por exemplo, `--openai-api-key`) exigem que essa env var esteja definida; caso contrário, o onboarding falha rapidamente.
  - Para provedores personalizados, o modo `ref` não interativo armazena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Nesse caso de provedor personalizado, `--custom-api-key` exige que `CUSTOM_API_KEY` esteja definida; caso contrário, o onboarding falha rapidamente.
- As credenciais de autenticação do Gateway aceitam opções de texto simples e SecretRef na configuração interativa:
  - Modo token: **Gerar/armazenar token em texto simples** (padrão) ou **Usar SecretRef**.
  - Modo senha: texto simples ou SecretRef.
- Caminho de SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
- Configurações existentes em texto simples continuam funcionando sem alterações.

<Note>
Dica para headless e servidor: conclua o OAuth em uma máquina com navegador e depois copie
o `auth-profiles.json` desse agente (por exemplo,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente
`$OPENCLAW_STATE_DIR/...`) para o host do Gateway. `credentials/oauth.json`
é apenas uma origem de importação legada.
</Note>

## Saídas e internos

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando `--skip-bootstrap` é passado
- `agents.defaults.model` / `models.providers` (se Minimax for escolhido)
- `tools.profile` (o onboarding local usa `"coding"` por padrão quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, tailscale)
- `session.dmScope` (o onboarding local define isso como `per-channel-peer` por padrão quando não definido; valores explícitos existentes são preservados)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissão de canais (Slack, Discord, Matrix, Microsoft Teams) quando você opta por isso durante os prompts (nomes são resolvidos para IDs quando possível)
- `skills.install.nodeManager`
  - A flag `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A configuração manual ainda pode definir `skills.install.nodeManager: "yarn"` posteriormente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` grava `agents.list[]` e `bindings` opcionais.

As credenciais do WhatsApp ficam em `~/.openclaw/credentials/whatsapp/<accountId>/`.
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

Clientes (app macOS e Control UI) podem renderizar etapas sem reimplementar a lógica de onboarding.

Comportamento de configuração do Signal:

- Baixa o asset de release apropriado
- Armazena-o em `~/.openclaw/tools/signal-cli/<version>/`
- Grava `channels.signal.cliPath` na configuração
- Builds JVM exigem Java 21
- Builds nativos são usados quando disponíveis
- Windows usa WSL2 e segue o fluxo Linux do signal-cli dentro do WSL

## Docs relacionados

- Hub de onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Automação e scripts: [Automação da CLI](/pt-BR/start/wizard-cli-automation)
- Referência de comandos: [`openclaw onboard`](/pt-BR/cli/onboard)
