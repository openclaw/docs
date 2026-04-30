---
read_when:
    - Consultar uma etapa ou um sinalizador específico de integração inicial
    - Automatizando a integração com o modo não interativo
    - Depuração do comportamento de integração
sidebarTitle: Onboarding Reference
summary: 'Referência completa para a integração inicial da CLI: cada etapa, opção e campo de configuração'
title: Referência de integração inicial
x-i18n:
    generated_at: "2026-04-30T10:08:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

Esta é a referência completa para `openclaw onboard`.
Para uma visão geral de alto nível, consulte [Onboarding (CLI)](/pt-BR/start/wizard).

## Detalhes do fluxo (modo local)

<Steps>
  <Step title="Existing config detection">
    - Se `~/.openclaw/openclaw.json` existir, escolha **Manter / Modificar / Redefinir**.
    - Executar o onboarding novamente **não** apaga nada, a menos que você escolha explicitamente **Redefinir**
      (ou passe `--reset`).
    - O padrão de CLI `--reset` é `config+creds+sessions`; use `--reset-scope full`
      para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e pede
      que você execute `openclaw doctor` antes de continuar.
    - A redefinição usa `trash` (nunca `rm`) e oferece escopos:
      - Somente configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o workspace)

  </Step>
  <Step title="Model/Auth">
    - **Chave de API da Anthropic**: usa `ANTHROPIC_API_KEY` se presente ou solicita uma chave e depois a salva para uso pelo daemon.
    - **Chave de API da Anthropic**: escolha preferida de assistente da Anthropic em onboarding/configuração.
    - **setup-token da Anthropic**: ainda disponível em onboarding/configuração, embora o OpenClaw agora prefira reutilizar a Claude CLI quando disponível.
    - **Assinatura OpenAI Code (Codex) (OAuth)**: fluxo no navegador; cole o `code#state`.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.5` quando o modelo não está definido ou já pertence à família OpenAI.
    - **Assinatura OpenAI Code (Codex) (pareamento de dispositivo)**: fluxo de pareamento no navegador com um código de dispositivo de curta duração.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.5` quando o modelo não está definido ou já pertence à família OpenAI.
    - **Chave de API da OpenAI**: usa `OPENAI_API_KEY` se presente ou solicita uma chave e depois a armazena em perfis de autenticação.
      - Define `agents.defaults.model` como `openai/gpt-5.5` quando o modelo não está definido, é `openai/*` ou `openai-codex/*`.
    - **Chave de API da xAI (Grok)**: solicita `XAI_API_KEY` e configura a xAI como provedora de modelo.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: oferece **Nuvem + Local**, **Somente nuvem** ou **Somente local** primeiro. `Cloud only` solicita `OLLAMA_API_KEY` e usa `https://ollama.com`; os modos baseados em host solicitam a URL base do Ollama, descobrem modelos disponíveis e baixam automaticamente o modelo local selecionado quando necessário; `Cloud + Local` também verifica se esse host Ollama está conectado para acesso à nuvem.
    - Mais detalhes: [Ollama](/pt-BR/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita ID da conta, ID do Gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
    - **MiniMax**: a configuração é gravada automaticamente; o padrão hospedado é `MiniMax-M2.7`.
      A configuração com chave de API usa `minimax/...`, e a configuração com OAuth usa
      `minimax-portal/...`.
    - Mais detalhes: [MiniMax](/pt-BR/providers/minimax)
    - **StepFun**: a configuração é gravada automaticamente para StepFun padrão ou Step Plan em endpoints da China ou globais.
    - Atualmente, o padrão inclui `step-3.5-flash`, e o Step Plan também inclui `step-3.5-flash-2603`.
    - Mais detalhes: [StepFun](/pt-BR/providers/stepfun)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/pt-BR/providers/synthetic)
    - **Moonshot (Kimi K2)**: a configuração é gravada automaticamente.
    - **Kimi Coding**: a configuração é gravada automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
    - **Ignorar**: nenhuma autenticação configurada ainda.
    - Escolha um modelo padrão entre as opções detectadas (ou informe provedor/modelo manualmente). Para melhor qualidade e menor risco de injeção de prompt, escolha o modelo mais forte de última geração disponível na sua pilha de provedores.
    - O onboarding executa uma verificação de modelo e avisa se o modelo configurado é desconhecido ou não tem autenticação.
    - O modo padrão de armazenamento de chave de API usa valores de perfil de autenticação em texto simples. Use `--secret-input-mode ref` para armazenar refs baseadas em env (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Os perfis de autenticação ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth). `~/.openclaw/credentials/oauth.json` é apenas importação legada.
    - Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)
    <Note>
    Dica para headless/servidor: conclua o OAuth em uma máquina com navegador e depois copie
    o `auth-profiles.json` desse agente (por exemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente
    `$OPENCLAW_STATE_DIR/...`) para o host do Gateway. `credentials/oauth.json`
    é apenas uma fonte de importação legada.
    </Note>
  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Semeia os arquivos de workspace necessários para o ritual de bootstrap do agente.
    - Layout completo do workspace + guia de backup: [Workspace do agente](/pt-BR/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Porta, bind, modo de autenticação, exposição via Tailscale.
    - Recomendação de autenticação: mantenha **Token** mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
      - O início rápido reutiliza SecretRefs existentes de `gateway.auth.token` entre provedores `env`, `file` e `exec` para a sonda de onboarding/bootstrap do painel.
      - Se esse SecretRef estiver configurado mas não puder ser resolvido, o onboarding falha cedo com uma mensagem clara de correção em vez de degradar silenciosamente a autenticação em runtime.
    - No modo senha, a configuração interativa também aceita armazenamento em texto simples ou SecretRef.
    - Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Requer uma variável de env não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a autenticação somente se você confiar totalmente em todos os processos locais.
    - Binds que não são loopback ainda exigem autenticação.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR.
    - [Telegram](/pt-BR/channels/telegram): token do bot.
    - [Discord](/pt-BR/channels/discord): token do bot.
    - [Google Chat](/pt-BR/channels/googlechat): JSON de conta de serviço + público do webhook.
    - [Mattermost](/pt-BR/channels/mattermost) (plugin): token do bot + URL base.
    - [Signal](/pt-BR/channels/signal): instalação opcional de `signal-cli` + configuração da conta.
    - [BlueBubbles](/pt-BR/channels/bluebubbles): **recomendado para iMessage**; URL do servidor + senha + webhook.
    - [iMessage](/pt-BR/channels/imessage): caminho legado da CLI `imsg` + acesso ao BD.
    - Segurança de DM: o padrão é pareamento. A primeira DM envia um código; aprove via `openclaw pairing approve <channel> <code>` ou use listas de permissão.

  </Step>
  <Step title="Web search">
    - Escolha um provedor compatível, como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou ignore).
    - Provedores baseados em API podem usar variáveis de env ou configuração existente para configuração rápida; provedores sem chave usam seus pré-requisitos específicos em vez disso.
    - Ignore com `--skip-search`.
    - Configure depois: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Requer uma sessão de usuário conectada; para headless, use um LaunchDaemon personalizado (não incluído).
    - Linux (e Windows via WSL2): unidade de usuário systemd
      - O onboarding tenta habilitar lingering via `loginctl enable-linger <user>` para que o Gateway permaneça ativo após o logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); ele tenta sem sudo primeiro.
    - **Seleção de runtime:** Node (recomendado; obrigatório para WhatsApp/Telegram). Bun **não é recomendado**.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon valida isso, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, a instalação do daemon será bloqueada com orientação acionável.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.

  </Step>
  <Step title="Health check">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - Dica: `openclaw status --deep` adiciona a sonda de integridade do gateway em tempo real à saída de status, incluindo sondas de canal quando compatíveis (requer um gateway acessível).

  </Step>
  <Step title="Skills (recommended)">
    - Lê as skills disponíveis e verifica os requisitos.
    - Permite escolher um gerenciador de node: **npm / pnpm** (bun não recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).

  </Step>
  <Step title="Finish">
    - Resumo + próximos passos, incluindo apps iOS/Android/macOS para recursos extras.

  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o onboarding imprime instruções de encaminhamento de porta SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o onboarding tenta compilá-los; o fallback é `pnpm ui:build` (instala automaticamente as dependências da UI).
</Note>

## Modo não interativo

Use `--non-interactive` para automatizar ou criar scripts de onboarding:

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

SecretRef de token do Gateway em modo não interativo:

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
Use esta página de referência para a semântica das flags e a ordem das etapas.

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

O Gateway expõe o fluxo de onboarding via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
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
- `tools.profile` (a integração local usa `"coding"` como padrão quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, tailscale)
- `session.dmScope` (detalhes de comportamento: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissões de canais (Slack/Discord/Matrix/Microsoft Teams) quando você opta por elas durante os prompts (nomes são resolvidos para IDs quando possível).
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

Alguns canais são fornecidos como plugins. Quando você escolhe um durante a configuração, a integração
solicitará a instalação dele (npm ou um caminho local) antes que ele possa ser configurado.

## Documentação relacionada

- Visão geral da integração: [Integração (CLI)](/pt-BR/start/wizard)
- Integração do aplicativo macOS: [Integração](/pt-BR/start/onboarding)
- Referência de configuração: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Provedores: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord), [Google Chat](/pt-BR/channels/googlechat), [Signal](/pt-BR/channels/signal), [BlueBubbles](/pt-BR/channels/bluebubbles) (iMessage), [iMessage](/pt-BR/channels/imessage) (legado)
- Skills: [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config)
