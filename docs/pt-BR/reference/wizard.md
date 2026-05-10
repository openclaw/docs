---
read_when:
    - Consultando uma etapa específica de integração inicial ou uma flag
    - Automatizando a integração com o modo não interativo
    - Depuração do comportamento da integração inicial
sidebarTitle: Onboarding Reference
summary: 'Referência completa para a configuração inicial da CLI: cada etapa, flag e campo de configuração'
title: Referência de integração inicial
x-i18n:
    generated_at: "2026-05-10T19:50:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: be3e45f152700f02a212a390cdc02d5432ff531716a089f531de3bb6cc368cc9
    source_path: reference/wizard.md
    workflow: 16
---

Esta é a referência completa para `openclaw onboard`.
Para uma visão geral de alto nível, consulte [Onboarding (CLI)](/pt-BR/start/wizard).

## Detalhes do fluxo (modo local)

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha **Manter valores atuais**, **Revisar e atualizar** ou **Redefinir antes da configuração**.
    - Executar o onboarding novamente **não** apaga nada, a menos que você escolha explicitamente **Redefinir**
      (ou passe `--reset`).
    - CLI `--reset` usa `config+creds+sessions` por padrão; use `--reset-scope full`
      para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e solicita
      que você execute `openclaw doctor` antes de continuar.
    - A redefinição usa `trash` (nunca `rm`) e oferece escopos:
      - Somente configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o workspace)

  </Step>
  <Step title="Modelo/Auth">
    - **Chave de API da Anthropic**: usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave, depois a salva para uso do daemon.
    - **Chave de API da Anthropic**: escolha preferida de assistente Anthropic no onboarding/configure.
    - **setup-token da Anthropic**: ainda disponível no onboarding/configure, embora o OpenClaw agora prefira reutilizar a Claude CLI quando disponível.
    - **Assinatura OpenAI Code (Codex) (OAuth)**: fluxo no navegador; cole o `code#state`.
      - Define `agents.defaults.model` como `openai/gpt-5.5` por meio do runtime Codex quando o modelo não está definido ou já é da família OpenAI.
    - **Assinatura OpenAI Code (Codex) (pareamento de dispositivo)**: fluxo de pareamento no navegador com um código de dispositivo de curta duração.
      - Define `agents.defaults.model` como `openai/gpt-5.5` por meio do runtime Codex quando o modelo não está definido ou já é da família OpenAI.
    - **Chave de API da OpenAI**: usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave, depois a armazena em perfis de auth.
      - Define `agents.defaults.model` como `openai/gpt-5.5` quando o modelo não está definido, é `openai/*` ou `openai-codex/*`.
    - **Chave de API da xAI (Grok)**: solicita `XAI_API_KEY` e configura a xAI como provedora de modelo.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: oferece primeiro **Nuvem + Local**, **Somente nuvem** ou **Somente local**. `Cloud only` solicita `OLLAMA_API_KEY` e usa `https://ollama.com`; os modos apoiados por host solicitam a URL base do Ollama, descobrem os modelos disponíveis e baixam automaticamente o modelo local selecionado quando necessário; `Cloud + Local` também verifica se esse host Ollama está conectado para acesso à nuvem.
    - Mais detalhes: [Ollama](/pt-BR/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita ID da conta, ID do Gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
    - **MiniMax**: a configuração é gravada automaticamente; o padrão hospedado é `MiniMax-M2.7`.
      A configuração com chave de API usa `minimax/...`, e a configuração OAuth usa
      `minimax-portal/...`.
    - Mais detalhes: [MiniMax](/pt-BR/providers/minimax)
    - **StepFun**: a configuração é gravada automaticamente para StepFun standard ou Step Plan em endpoints da China ou globais.
    - Atualmente, Standard inclui `step-3.5-flash`, e Step Plan também inclui `step-3.5-flash-2603`.
    - Mais detalhes: [StepFun](/pt-BR/providers/stepfun)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/pt-BR/providers/synthetic)
    - **Moonshot (Kimi K2)**: a configuração é gravada automaticamente.
    - **Kimi Coding**: a configuração é gravada automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
    - **Pular**: nenhuma auth configurada ainda.
    - Escolha um modelo padrão entre as opções detectadas (ou informe provedor/modelo manualmente). Para obter a melhor qualidade e menor risco de injeção de prompt, escolha o modelo mais forte da geração mais recente disponível na sua pilha de provedores.
    - O onboarding executa uma verificação de modelo e alerta se o modelo configurado for desconhecido ou não tiver auth.
    - O modo de armazenamento de chave de API usa valores de perfil de auth em texto simples por padrão. Use `--secret-input-mode ref` para armazenar refs baseadas em env (por exemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Perfis de auth ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth). `~/.openclaw/credentials/oauth.json` é apenas importação legada.
    - Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)
    <Note>
    Dica para headless/servidor: conclua o OAuth em uma máquina com navegador, depois copie
    o `auth-profiles.json` desse agente (por exemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente
    `$OPENCLAW_STATE_DIR/...`) para o host do Gateway. `credentials/oauth.json`
    é apenas uma fonte de importação legada.
    </Note>
  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Inicializa os arquivos de workspace necessários para o ritual de bootstrap do agente.
    - Layout completo do workspace + guia de backup: [Workspace do agente](/pt-BR/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Porta, bind, modo de auth, exposição via Tailscale.
    - Recomendação de auth: mantenha **Token** mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
      - O Quickstart reutiliza SecretRefs `gateway.auth.token` existentes nos provedores `env`, `file` e `exec` para a sonda de onboarding/bootstrap do painel.
      - Se esse SecretRef estiver configurado, mas não puder ser resolvido, o onboarding falha cedo com uma mensagem clara de correção em vez de degradar silenciosamente a auth em runtime.
    - No modo senha, a configuração interativa também oferece suporte a armazenamento em texto simples ou SecretRef.
    - Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a auth apenas se você confiar plenamente em todos os processos locais.
    - Binds que não sejam loopback ainda exigem auth.

  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR.
    - [Telegram](/pt-BR/channels/telegram): token do bot.
    - [Discord](/pt-BR/channels/discord): token do bot.
    - [Google Chat](/pt-BR/channels/googlechat): JSON da conta de serviço + público do webhook.
    - [Mattermost](/pt-BR/channels/mattermost) (Plugin): token do bot + URL base.
    - [Signal](/pt-BR/channels/signal): instalação opcional do `signal-cli` + configuração da conta.
    - [iMessage](/pt-BR/channels/imessage): caminho da CLI `imsg` + acesso ao banco de dados do Messages; use um wrapper SSH quando o Gateway rodar fora do Mac.
    - Segurança de DM: o padrão é pareamento. A primeira DM envia um código; aprove via `openclaw pairing approve <channel> <code>` ou use listas de permissão.

  </Step>
  <Step title="Pesquisa na web">
    - Escolha um provedor com suporte, como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou pule).
    - Provedores baseados em API podem usar variáveis de ambiente ou configuração existente para configuração rápida; provedores sem chave usam seus pré-requisitos específicos de provedor.
    - Pule com `--skip-search`.
    - Configure depois: `openclaw configure --section web`.

  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Exige uma sessão de usuário conectada; para headless, use um LaunchDaemon personalizado (não distribuído).
    - Linux (e Windows via WSL2): unidade de usuário systemd
      - O onboarding tenta habilitar lingering via `loginctl enable-linger <user>` para que o Gateway permaneça ativo após logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); ele tenta sem sudo primeiro.
    - **Seleção de runtime:** Node (recomendado; necessário para WhatsApp/Telegram). Bun **não é recomendado**.
    - Se a auth por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
    - Se a auth por token exigir um token e o SecretRef de token configurado não for resolvido, a instalação do daemon é bloqueada com orientação acionável.
    - Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon é bloqueada até que o modo seja definido explicitamente.

  </Step>
  <Step title="Verificação de integridade">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - Dica: `openclaw status --deep` adiciona a sonda de integridade do gateway ao vivo à saída de status, incluindo sondas de canal quando houver suporte (exige um gateway acessível).

  </Step>
  <Step title="Skills (recomendado)">
    - Lê as skills disponíveis e verifica os requisitos.
    - Permite escolher um gerenciador de node: **npm / pnpm** (bun não recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).

  </Step>
  <Step title="Finalizar">
    - Resumo + próximos passos, incluindo o prompt **Como você quer chocar seu agente?** para Terminal, Browser ou mais tarde.

  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o onboarding imprime instruções de encaminhamento de porta SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o onboarding tenta compilá-los; o fallback é `pnpm ui:build` (instala automaticamente as deps da UI).
</Note>

## Modo não interativo

Use `--non-interactive` para automatizar ou scriptar o onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Adicione `--json` para um resumo legível por máquina.

SecretRef de token do Gateway no modo não interativo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.

<Note>
`--json` **não** implica modo não interativo. Use `--non-interactive` (e `--workspace`) para scripts.
</Note>

Exemplos de comandos específicos de provedor ficam em [Automação da CLI](/pt-BR/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referência para a semântica de flags e a ordem das etapas.

### Adicionar agente (não interativo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC do assistente do Gateway

O Gateway expõe o fluxo de onboarding por RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clientes (app macOS, Control UI) podem renderizar etapas sem reimplementar a lógica de onboarding.

## Configuração do Signal (signal-cli)

O onboarding pode instalar `signal-cli` a partir de releases do GitHub:

- Baixa o asset de release apropriado.
- Armazena-o em `~/.openclaw/tools/signal-cli/<version>/`.
- Grava `channels.signal.cliPath` na sua configuração.

Observações:

- Builds JVM exigem **Java 21**.
- Builds nativos são usados quando disponíveis.
- Windows usa WSL2; a instalação do signal-cli segue o fluxo Linux dentro do WSL.

## O que o assistente grava

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se Minimax for escolhido)
- `tools.profile` (a integração inicial local usa `"coding"` por padrão quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, tailscale)
- `session.dmScope` (detalhes do comportamento: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissão de canais (Slack/Discord/Matrix/Microsoft Teams) quando você optar por elas durante as solicitações (os nomes são resolvidos para IDs quando possível).
- `skills.install.nodeManager`
  - `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A configuração manual ainda pode usar `yarn` definindo `skills.install.nodeManager` diretamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` grava `agents.list[]` e `bindings` opcionais.

As credenciais do WhatsApp ficam em `~/.openclaw/credentials/whatsapp/<accountId>/`.
As sessões são armazenadas em `~/.openclaw/agents/<agentId>/sessions/`.

Alguns canais são entregues como plugins. Quando você escolhe um durante a configuração, a integração inicial
solicitará a instalação dele (npm ou um caminho local) antes que ele possa ser configurado.

## Documentos relacionados

- Visão geral da integração inicial: [Integração inicial (CLI)](/pt-BR/start/wizard)
- Integração inicial do app macOS: [Integração inicial](/pt-BR/start/onboarding)
- Referência de configuração: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Provedores: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord), [Google Chat](/pt-BR/channels/googlechat), [Signal](/pt-BR/channels/signal), [iMessage](/pt-BR/channels/imessage)
- Skills: [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config)
