---
read_when:
    - Consultando uma etapa ou flag específica de integração
    - Automatizando a integração com o modo não interativo
    - Depurando o comportamento de integração
sidebarTitle: Onboarding Reference
summary: 'Referência completa para integração pela CLI: cada etapa, flag e campo de configuração'
title: Referência de integração
x-i18n:
    generated_at: "2026-06-27T18:11:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
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
      para também remover o espaço de trabalho.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e pede
      que você execute `openclaw doctor` antes de continuar.
    - A redefinição usa `trash` (nunca `rm`) e oferece escopos:
      - Somente configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o espaço de trabalho)

  </Step>
  <Step title="Modelo/Autenticação">
    - **Chave de API da Anthropic**: usa `ANTHROPIC_API_KEY` se presente ou solicita uma chave, depois a salva para uso pelo daemon.
    - **Chave de API da Anthropic**: escolha preferida de assistente Anthropic no onboarding/configuração.
    - **setup-token da Anthropic**: ainda disponível no onboarding/configuração, embora o OpenClaw agora prefira reutilizar o Claude CLI quando disponível.
    - **Assinatura do OpenAI Code (Codex) (OAuth)**: fluxo pelo navegador; cole o `code#state`.
      - Define `agents.defaults.model` como `openai/gpt-5.5` por meio do runtime do Codex quando o modelo não estiver definido ou já for da família OpenAI.
    - **Assinatura do OpenAI Code (Codex) (emparelhamento de dispositivo)**: fluxo de emparelhamento pelo navegador com um código de dispositivo de curta duração.
      - Define `agents.defaults.model` como `openai/gpt-5.5` por meio do runtime do Codex quando o modelo não estiver definido ou já for da família OpenAI.
    - **Chave de API da OpenAI**: usa `OPENAI_API_KEY` se presente ou solicita uma chave, depois a armazena em perfis de autenticação.
      - Define `agents.defaults.model` como `openai/gpt-5.5` quando o modelo não estiver definido, for `openai/*` ou referências legadas de modelo Codex.
    - **OAuth / chave de API da xAI (Grok)**: entra com OAuth da xAI quando escolhido, ou solicita `XAI_API_KEY` no caminho de chave de API, e configura a xAI como provedor de modelo.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: oferece primeiro **Nuvem + Local**, **Somente nuvem** ou **Somente local**. `Cloud only` solicita `OLLAMA_API_KEY` e usa `https://ollama.com`; os modos com host solicitam a URL base do Ollama, descobrem os modelos disponíveis e baixam automaticamente o modelo local selecionado quando necessário; `Cloud + Local` também verifica se esse host Ollama está conectado para acesso à nuvem.
    - Mais detalhes: [Ollama](/pt-BR/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
    - **MiniMax**: a configuração é gravada automaticamente; o padrão hospedado é `MiniMax-M3`.
      A configuração por chave de API usa `minimax/...`, e a configuração por OAuth usa
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
    - **Pular**: nenhuma autenticação configurada ainda.
    - Escolha um modelo padrão entre as opções detectadas (ou informe provedor/modelo manualmente). Para melhor qualidade e menor risco de injeção de prompt, escolha o modelo de geração mais recente e mais forte disponível na sua pilha de provedores.
    - O onboarding executa uma verificação de modelo e avisa se o modelo configurado for desconhecido ou estiver sem autenticação.
    - O modo de armazenamento da chave de API usa por padrão valores de perfil de autenticação em texto simples. Use `--secret-input-mode ref` para armazenar referências baseadas em env (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Os perfis de autenticação ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth). `~/.openclaw/credentials/oauth.json` é apenas uma importação legada.
    - Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)
    <Note>
    Dica para servidor/headless: conclua o OAuth em uma máquina com navegador, depois copie
    o `auth-profiles.json` desse agente (por exemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente
    `$OPENCLAW_STATE_DIR/...`) para o host do gateway. `credentials/oauth.json`
    é apenas uma fonte de importação legada.
    </Note>
  </Step>
  <Step title="Espaço de trabalho">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Inicializa os arquivos do espaço de trabalho necessários para o ritual de bootstrap do agente.
    - Layout completo do espaço de trabalho + guia de backup: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Porta, bind, modo de autenticação, exposição via Tailscale.
    - Recomendação de autenticação: mantenha **Token** mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
      - O Quickstart reutiliza SecretRefs existentes de `gateway.auth.token` entre provedores `env`, `file` e `exec` para a sonda de onboarding/bootstrap do painel.
      - Se esse SecretRef estiver configurado mas não puder ser resolvido, o onboarding falha cedo com uma mensagem clara de correção em vez de degradar silenciosamente a autenticação em runtime.
    - No modo senha, a configuração interativa também oferece suporte a armazenamento em texto simples ou SecretRef.
    - Caminho de SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a autenticação somente se você confiar totalmente em todos os processos locais.
    - Binds que não sejam loopback ainda exigem autenticação.

  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR.
    - [Telegram](/pt-BR/channels/telegram): token do bot.
    - [Discord](/pt-BR/channels/discord): token do bot.
    - [Google Chat](/pt-BR/channels/googlechat): JSON da conta de serviço + público do webhook.
    - [Mattermost](/pt-BR/channels/mattermost) (Plugin): token do bot + URL base.
    - [Signal](/pt-BR/channels/signal): instalação opcional de `signal-cli` + configuração da conta.
    - [iMessage](/pt-BR/channels/imessage): caminho da CLI `imsg` + acesso ao banco de dados do Messages; use um wrapper SSH quando o Gateway for executado fora do Mac.
    - Segurança de DM: o padrão é emparelhamento. A primeira DM envia um código; aprove via `openclaw pairing approve <channel> <code>` ou use allowlists.

  </Step>
  <Step title="Pesquisa na web">
    - Escolha um provedor compatível, como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou pule).
    - Provedores com API podem usar variáveis de ambiente ou configuração existente para uma configuração rápida; provedores sem chave usam seus pré-requisitos específicos de provedor.
    - Pule com `--skip-search`.
    - Configure depois: `openclaw configure --section web`.

  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Exige uma sessão de usuário conectada; para headless, use um LaunchDaemon personalizado (não distribuído).
    - Linux (e Windows via WSL2): unidade de usuário systemd
      - O onboarding tenta habilitar lingering via `loginctl enable-linger <user>` para que o Gateway permaneça ativo após logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); ele tenta sem sudo primeiro.
    - **Seleção de runtime:** Node (recomendado; obrigatório para WhatsApp/Telegram). Bun **não é recomendado**.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não estiver resolvido, a instalação do daemon é bloqueada com orientações acionáveis.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon é bloqueada até que o modo seja definido explicitamente.

  </Step>
  <Step title="Verificação de integridade">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - Dica: `openclaw status --deep` adiciona a sonda de integridade do gateway ativo à saída de status, incluindo sondas de canal quando compatíveis (exige um gateway acessível).

  </Step>
  <Step title="Skills (recomendado)">
    - Lê as Skills disponíveis e verifica os requisitos.
    - Permite escolher um gerenciador de node: **npm / pnpm** (bun não recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).

  </Step>
  <Step title="Finalização">
    - Resumo + próximos passos, incluindo o prompt **Como você quer chocar seu agente?** para Terminal, Browser ou mais tarde.

  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o onboarding imprime instruções de encaminhamento de porta SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o onboarding tenta criá-los; o fallback é `pnpm ui:build` (instala automaticamente as dependências da UI).
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
Use esta página de referência para semântica de flags e ordem das etapas.

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
- Armazena em `~/.openclaw/tools/signal-cli/<version>/`.
- Grava `channels.signal.cliPath` na sua configuração.

Observações:

- Builds JVM exigem **Java 21**.
- Builds nativos são usados quando disponíveis.
- Windows usa WSL2; a instalação do signal-cli segue o fluxo do Linux dentro do WSL.

## O que o assistente grava

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se Minimax for escolhido)
- `tools.profile` (a integração local usa `"coding"` como padrão quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, tailscale)
- `session.dmScope` (detalhes de comportamento: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissões de canais (Slack/Discord/Matrix/Microsoft Teams) quando você opta por elas durante os prompts (os nomes são resolvidos para IDs quando possível).
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

Alguns canais são entregues como plugins. Quando você escolhe um durante a configuração, a integração
solicitará a instalação dele (npm ou um caminho local) antes que ele possa ser configurado.

## Documentação relacionada

- Visão geral da integração: [Integração (CLI)](/pt-BR/start/wizard)
- Integração do app macOS: [Integração](/pt-BR/start/onboarding)
- Referência de configuração: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Provedores: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord), [Google Chat](/pt-BR/channels/googlechat), [Signal](/pt-BR/channels/signal), [iMessage](/pt-BR/channels/imessage)
- Skills: [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config)
