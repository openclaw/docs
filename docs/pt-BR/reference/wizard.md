---
read_when:
    - Consultando uma etapa ou flag específica do onboarding
    - Automatizando o onboarding com modo não interativo
    - Depurando o comportamento do onboarding
sidebarTitle: Onboarding Reference
summary: 'Referência completa do onboarding da CLI: cada etapa, flag e campo de configuração'
title: Referência de onboarding
x-i18n:
    generated_at: "2026-04-07T05:31:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: a142b9ec4323fabb9982d05b64375d2b4a4007dffc910acbee3a38ff871a7236
    source_path: reference/wizard.md
    workflow: 15
---

# Referência de onboarding

Esta é a referência completa para `openclaw onboard`.
Para uma visão geral de alto nível, consulte [Onboarding (CLI)](/pt-BR/start/wizard).

## Detalhes do fluxo (modo local)

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha **Keep / Modify / Reset**.
    - Executar o onboarding novamente **não** apaga nada, a menos que você escolha explicitamente **Reset**
      (ou passe `--reset`).
    - `--reset` na CLI usa por padrão `config+creds+sessions`; use `--reset-scope full`
      para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e pede
      que você execute `openclaw doctor` antes de continuar.
    - O reset usa `trash` (nunca `rm`) e oferece escopos:
      - Apenas configuração
      - Configuração + credenciais + sessões
      - Reset completo (também remove o workspace)
  </Step>
  <Step title="Modelo/Autenticação">
    - **Chave de API da Anthropic**: usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave e depois a salva para uso pelo daemon.
    - **Chave de API da Anthropic**: escolha preferida de assistente Anthropic no onboarding/configuração.
    - **Setup-token da Anthropic**: ainda está disponível no onboarding/configuração, embora o OpenClaw agora prefira reutilização do Claude CLI quando disponível.
    - **Assinatura OpenAI Code (Codex) (Codex CLI)**: se `~/.codex/auth.json` existir, o onboarding pode reutilizá-lo. Credenciais reutilizadas do Codex CLI continuam sendo gerenciadas pelo Codex CLI; ao expirar, o OpenClaw relê essa fonte primeiro e, quando o provedor consegue atualizá-la, grava a credencial atualizada de volta no armazenamento do Codex em vez de assumir seu gerenciamento.
    - **Assinatura OpenAI Code (Codex) (OAuth)**: fluxo no navegador; cole `code#state`.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.4` quando o modelo não está definido ou é `openai/*`.
    - **Chave de API da OpenAI**: usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave e depois a armazena nos perfis de autenticação.
      - Define `agents.defaults.model` como `openai/gpt-5.4` quando o modelo não está definido, é `openai/*` ou `openai-codex/*`.
    - **Chave de API da xAI (Grok)**: solicita `XAI_API_KEY` e configura xAI como provedor de modelo.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: solicita a URL base do Ollama, oferece modo **Cloud + Local** ou **Local**, descobre modelos disponíveis e faz pull automaticamente do modelo local selecionado quando necessário.
    - Mais detalhes: [Ollama](/pt-BR/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
    - **MiniMax**: a configuração é gravada automaticamente; o padrão hospedado é `MiniMax-M2.7`.
      A configuração com chave de API usa `minimax/...`, e a configuração com OAuth usa
      `minimax-portal/...`.
    - Mais detalhes: [MiniMax](/pt-BR/providers/minimax)
    - **StepFun**: a configuração é gravada automaticamente para o StepFun padrão ou Step Plan em endpoints da China ou globais.
    - Atualmente, o padrão inclui `step-3.5-flash`, e o Step Plan também inclui `step-3.5-flash-2603`.
    - Mais detalhes: [StepFun](/pt-BR/providers/stepfun)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/pt-BR/providers/synthetic)
    - **Moonshot (Kimi K2)**: a configuração é gravada automaticamente.
    - **Kimi Coding**: a configuração é gravada automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
    - **Skip**: nenhuma autenticação configurada ainda.
    - Escolha um modelo padrão a partir das opções detectadas (ou insira manualmente provider/model). Para melhor qualidade e menor risco de prompt injection, escolha o modelo mais forte e mais recente disponível na sua pilha de provedores.
    - O onboarding executa uma verificação do modelo e avisa se o modelo configurado é desconhecido ou se falta autenticação.
    - O modo de armazenamento da chave de API usa por padrão valores em texto simples em perfil de autenticação. Use `--secret-input-mode ref` para armazenar refs com respaldo em env em vez disso (por exemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Os perfis de autenticação ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth). `~/.openclaw/credentials/oauth.json` é um arquivo legado apenas para importação.
    - Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)
    <Note>
    Dica para headless/servidor: conclua o OAuth em uma máquina com navegador e depois copie
    `auth-profiles.json` desse agente (por exemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente
    em `$OPENCLAW_STATE_DIR/...`) para o host do gateway. `credentials/oauth.json`
    é apenas uma fonte legada de importação.
    </Note>
  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Inicializa os arquivos de workspace necessários para o ritual de bootstrap do agente.
    - Layout completo do workspace + guia de backup: [Workspace do agente](/pt-BR/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modo de autenticação, exposição via tailscale.
    - Recomendação de autenticação: mantenha **Token** mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Generate/store plaintext token** (padrão)
      - **Use SecretRef** (opcional)
      - O início rápido reutiliza SecretRefs existentes de `gateway.auth.token` nos provedores `env`, `file` e `exec` para a sonda de onboarding/bootstrap da dashboard.
      - Se esse SecretRef estiver configurado, mas não puder ser resolvido, o onboarding falha logo no início com uma mensagem clara de correção em vez de degradar silenciosamente a autenticação em runtime.
    - No modo senha, a configuração interativa também oferece armazenamento em texto simples ou SecretRef.
    - Caminho não interativo de SecretRef de token do gateway: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a autenticação apenas se você confiar totalmente em todos os processos locais.
    - Binds não loopback continuam exigindo autenticação.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR.
    - [Telegram](/pt-BR/channels/telegram): token de bot.
    - [Discord](/pt-BR/channels/discord): token de bot.
    - [Google Chat](/pt-BR/channels/googlechat): JSON de conta de serviço + audience de webhook.
    - [Mattermost](/pt-BR/channels/mattermost) (plugin): token de bot + URL base.
    - [Signal](/pt-BR/channels/signal): instalação opcional de `signal-cli` + configuração de conta.
    - [BlueBubbles](/pt-BR/channels/bluebubbles): **recomendado para iMessage**; URL do servidor + senha + webhook.
    - [iMessage](/pt-BR/channels/imessage): caminho legado do `imsg` CLI + acesso ao banco de dados.
    - Segurança de DM: o padrão é pareamento. O primeiro DM envia um código; aprove com `openclaw pairing approve <channel> <code>` ou use allowlists.
  </Step>
  <Step title="Pesquisa na web">
    - Escolha um provedor compatível, como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou ignore).
    - Provedores com API podem usar variáveis de ambiente ou configuração existente para configuração rápida; provedores sem chave usam seus pré-requisitos específicos.
    - Ignore com `--skip-search`.
    - Configure depois: `openclaw configure --section web`.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Exige uma sessão de usuário conectada; para headless, use um LaunchDaemon personalizado (não incluído).
    - Linux (e Windows via WSL2): unidade de usuário do systemd
      - O onboarding tenta habilitar lingering com `loginctl enable-linger <user>` para que o Gateway permaneça ativo após logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); primeiro tenta sem sudo.
    - **Seleção de runtime:** Node (recomendado; obrigatório para WhatsApp/Telegram). Bun **não é recomendado**.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço supervisor.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, a instalação do daemon será bloqueada com orientação acionável.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.
  </Step>
  <Step title="Verificação de integridade">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - Dica: `openclaw status --deep` adiciona a sonda de integridade do gateway em tempo real à saída de status, incluindo sondas de canal quando compatível (exige um gateway acessível).
  </Step>
  <Step title="Skills (recomendado)">
    - Lê as Skills disponíveis e verifica os requisitos.
    - Permite escolher um gerenciador de nós: **npm / pnpm** (bun não é recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Finalizar">
    - Resumo + próximos passos, incluindo apps para iOS/Android/macOS para recursos extras.
  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o onboarding imprime instruções de encaminhamento de porta por SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o onboarding tentará compilá-los; o fallback é `pnpm ui:build` (instala automaticamente as dependências da UI).
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

SecretRef de token do gateway no modo não interativo:

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
`--json` **não** implica modo não interativo. Use `--non-interactive` (e `--workspace`) em scripts.
</Note>

Exemplos de comandos específicos por provedor estão em [Automação da CLI](/pt-BR/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referência para semântica de flags e ordenação das etapas.

### Adicionar agente (não interativo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC do assistente do Gateway

O Gateway expõe o fluxo de onboarding por RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Os clientes (app de macOS, Control UI) podem renderizar etapas sem reimplementar a lógica de onboarding.

## Configuração do Signal (signal-cli)

O onboarding pode instalar `signal-cli` a partir das releases do GitHub:

- Baixa o asset de release apropriado.
- Armazena em `~/.openclaw/tools/signal-cli/<version>/`.
- Grava `channels.signal.cliPath` na sua configuração.

Observações:

- Builds JVM exigem **Java 21**.
- Builds nativos são usados quando disponíveis.
- O Windows usa WSL2; a instalação de signal-cli segue o fluxo Linux dentro do WSL.

## O que o assistente grava

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se MiniMax for escolhido)
- `tools.profile` (o onboarding local usa por padrão `"coding"` quando não está definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, tailscale)
- `session.dmScope` (detalhes de comportamento: [CLI Setup Reference](/pt-BR/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack/Discord/Matrix/Microsoft Teams) quando você opta por isso durante os prompts (nomes são resolvidos para IDs quando possível).
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

Alguns canais são entregues como plugins. Quando você escolhe um deles durante a configuração, o onboarding
solicita a instalação dele (npm ou um caminho local) antes que possa ser configurado.

## Documentação relacionada

- Visão geral do onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Onboarding do app para macOS: [Onboarding](/pt-BR/start/onboarding)
- Referência de configuração: [Configuração do gateway](/pt-BR/gateway/configuration)
- Provedores: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord), [Google Chat](/pt-BR/channels/googlechat), [Signal](/pt-BR/channels/signal), [BlueBubbles](/pt-BR/channels/bluebubbles) (iMessage), [iMessage](/pt-BR/channels/imessage) (legado)
- Skills: [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config)
