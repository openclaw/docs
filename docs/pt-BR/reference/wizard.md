---
read_when:
    - Consultando uma etapa ou opção específica da integração inicial
    - Automatizando a integração com o modo não interativo
    - Depuração do comportamento de integração inicial
sidebarTitle: Onboarding Reference
summary: 'Referência completa para a integração pela CLI: todas as etapas, flags e campos de configuração'
title: Referência de integração inicial
x-i18n:
    generated_at: "2026-07-12T15:37:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39155617d74a4004e9474c9d0ede231a6ccd4cb31becc07f25bcd9306b6a6675
    source_path: reference/wizard.md
    workflow: 16
---

Esta é a referência completa de `openclaw onboard`.
Para uma visão geral de alto nível, consulte [Integração inicial (CLI)](/pt-BR/start/wizard). Para conhecer o comportamento e as saídas
passo a passo, consulte a [Referência de configuração pela CLI](/pt-BR/start/wizard-cli-reference).

## Detalhes do fluxo (modo local)

<Steps>
  <Step title="Redefinição (opcional)">
    - `--reset` redefine o estado antes da execução da configuração; sem essa opção, executar novamente a integração inicial
      mantém a configuração existente e a reutiliza como valores padrão.
    - `--reset-scope` controla o que `--reset` remove: `config` (somente o arquivo de
      configuração), `config+creds+sessions` (padrão) ou `full` (também remove o
      espaço de trabalho).
    - Se o arquivo de configuração for inválido, a integração inicial será interrompida e solicitará que você execute
      `openclaw doctor` primeiro e, depois, execute novamente a configuração.
    - A redefinição move o estado para a Lixeira (nunca o exclui diretamente).

  </Step>
  <Step title="Reconhecimento dos riscos">
    - A primeira execução (ou qualquer execução antes da definição de `wizard.securityAcknowledgedAt`)
      solicita que você confirme que entende que os agentes são poderosos e que o acesso
      total ao sistema envolve riscos.
    - `--non-interactive` exige `--accept-risk` explicitamente; sem essa opção,
      a integração inicial é encerrada com um erro em vez de exibir uma solicitação.
    - Execuções interativas exibem uma solicitação de confirmação em vez de usar a opção; recusar
      cancela a configuração.

  </Step>
  <Step title="Modelo/autenticação">
    - **Chave de API da Anthropic**: usa `ANTHROPIC_API_KEY`, se estiver presente, ou solicita uma chave e a salva para uso pelo daemon.
    - **CLI do Anthropic Claude**: caminho local preferencial quando já existe uma sessão iniciada na CLI do Claude; o OpenClaw ainda aceita a autenticação por token de configuração da Anthropic como alternativa.
    - **Assinatura do OpenAI Code (Codex) (OAuth)**: fluxo pelo navegador; cole o `code#state`.
      - Em uma configuração nova sem modelo principal, define `agents.defaults.model` como `openai/gpt-5.6-sol` por meio do runtime do Codex.
    - **Assinatura do OpenAI Code (Codex) (pareamento de dispositivo)**: fluxo de pareamento pelo navegador com um código de dispositivo de curta duração.
      - Em uma configuração nova sem modelo principal, define `agents.defaults.model` como `openai/gpt-5.6-sol` por meio do runtime do Codex.
    - **Chave de API da OpenAI**: usa `OPENAI_API_KEY`, se estiver presente, ou solicita uma chave e a armazena nos perfis de autenticação.
      - Em uma configuração nova sem modelo principal, define `agents.defaults.model` como `openai/gpt-5.6`; o ID de modelo simples da API direta é resolvido para o nível Sol.
    - Adicionar ou autenticar novamente a OpenAI preserva um modelo principal explícito existente, incluindo `openai/gpt-5.5`. Se a conta não disponibilizar o GPT-5.6, selecione `openai/gpt-5.5` explicitamente; o OpenClaw não rebaixa o modelo silenciosamente.
    - **OAuth da xAI**: início de sessão pelo navegador com código de dispositivo, sem exigir callback em localhost; portanto, também funciona por SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Chave de API da xAI**: solicita `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` ainda funciona como um alias de compatibilidade somente manual para o mesmo fluxo OAuth da xAI com código de dispositivo; use `xai-oauth` em novos scripts.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha-a em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: primeiro oferece **Nuvem + local**, **Somente nuvem** ou **Somente local**. `Cloud only` solicita `OLLAMA_API_KEY` e usa `https://ollama.com`; os modos que usam um host solicitam a URL base do Ollama (padrão `http://127.0.0.1:11434`), descobrem os modelos disponíveis e baixam automaticamente o modelo local selecionado quando necessário; `Cloud + Local` também verifica se esse host do Ollama está conectado para acesso à nuvem.
    - Mais detalhes: [Ollama](/pt-BR/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy de vários modelos)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita o ID da conta, o ID do Gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
    - **MiniMax**: a configuração é gravada automaticamente; o padrão hospedado é `MiniMax-M3`.
      A configuração por chave de API usa `minimax/...`, e a configuração por OAuth usa
      `minimax-portal/...`.
    - Mais detalhes: [MiniMax](/pt-BR/providers/minimax)
    - **StepFun**: a configuração é gravada automaticamente para o StepFun padrão ou o Step Plan em endpoints da China ou globais.
    - Atualmente, o padrão usa `step-3.5-flash`; o Step Plan também inclui `step-3.5-flash-2603`.
    - Mais detalhes: [StepFun](/pt-BR/providers/stepfun)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/pt-BR/providers/synthetic)
    - **Moonshot (Kimi K2)**: a configuração é gravada automaticamente.
    - **Kimi Coding**: a configuração é gravada automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
    - **Provedor personalizado**: funciona com endpoints compatíveis com OpenAI, OpenAI Responses ou Anthropic. Opções para uso não interativo: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (opcional; usa `CUSTOM_API_KEY` como alternativa), `--custom-provider-id` (opcional; derivado automaticamente da URL base), `--custom-compatibility openai|openai-responses|anthropic` (padrão `openai`), `--custom-image-input` / `--custom-text-input` (substituem a detecção inferida de modelos com recursos visuais).
    - **Pular**: nenhuma autenticação configurada ainda.
    - Escolha um modelo padrão entre as opções detectadas (ou informe manualmente o provedor/modelo). Para obter a melhor qualidade e reduzir o risco de injeção de prompt, escolha o modelo mais avançado da geração mais recente disponível no conjunto de provedores.
    - A integração inicial executa uma verificação do modelo e avisa se o modelo configurado for desconhecido ou não tiver autenticação.
    - Por padrão, o modo de armazenamento de chaves de API usa valores em texto simples no perfil de autenticação. Use `--secret-input-mode ref` para armazenar referências baseadas em variáveis de ambiente (por exemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); a variável de ambiente referenciada já deve estar definida, ou a integração inicial falhará imediatamente.
    - Os perfis de autenticação ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth). `~/.openclaw/credentials/oauth.json` é usado somente para importação legada.
    - Mais detalhes: [OAuth](/pt-BR/concepts/oauth)
    <Note>
    Dica para ambientes sem interface gráfica/servidores: conclua o OAuth em uma máquina com navegador e copie
    o `auth-profiles.json` desse agente (por exemplo,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ou o caminho correspondente em
    `$OPENCLAW_STATE_DIR/...`) para o host do Gateway. `credentials/oauth.json`
    é somente uma fonte de importação legada.
    </Note>
  </Step>
  <Step title="Espaço de trabalho">
    - O padrão é `~/.openclaw/workspace` (configurável).
    - Preenche o espaço de trabalho com os arquivos necessários para o ritual de inicialização do agente.
    - Layout completo do espaço de trabalho + guia de backup: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Porta (padrão **18789**), vinculação, modo de autenticação e exposição pelo Tailscale.
    - Recomendação de autenticação: mantenha **Token** mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo de token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opcional)
      - O início rápido reutiliza SecretRefs existentes de `gateway.auth.token` nos provedores `env`, `file` e `exec` para a sondagem da integração inicial/inicialização do painel.
      - Se essa SecretRef estiver configurada, mas não puder ser resolvida, a integração inicial falhará antecipadamente com uma mensagem clara de correção, em vez de degradar silenciosamente a autenticação do runtime.
    - No modo de senha, a configuração interativa também permite armazenamento em texto simples ou por SecretRef.
    - Caminho não interativo para SecretRef do token: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo da integração inicial.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a autenticação somente se confiar totalmente em todos os processos locais.
    - Vinculações que não sejam de loopback ainda exigem autenticação.

  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR code.
    - [Telegram](/pt-BR/channels/telegram): token do bot.
    - [Discord](/pt-BR/channels/discord): token do bot.
    - [Google Chat](/pt-BR/channels/googlechat): JSON da conta de serviço + público-alvo do webhook.
    - [Mattermost](/pt-BR/channels/mattermost) (plugin): token do bot + URL base.
    - [Signal](/pt-BR/channels/signal) (plugin): instalação opcional do `signal-cli` + configuração da conta.
    - [iMessage](/pt-BR/channels/imessage): caminho da CLI `imsg` + acesso ao banco de dados do Mensagens; use um wrapper SSH quando o Gateway for executado fora de um Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack e outros canais são fornecidos como
      plugins que a integração inicial pode instalar para você. Catálogo completo: [Canais](/pt-BR/channels).
    - Segurança de mensagens diretas: o padrão é o pareamento. A primeira mensagem direta envia um código; aprove com `openclaw pairing approve <channel> <code>` ou use listas de permissões.

  </Step>
  <Step title="Pesquisa na web">
    - Escolha um provedor compatível, como Brave, Codex (pesquisa hospedada), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG ou Tavily (ou pule).
    - Provedores baseados em API podem usar variáveis de ambiente ou a configuração existente para uma configuração rápida; provedores sem chave usam os próprios pré-requisitos específicos.
    - Pule com `--skip-search`.
    - Configure posteriormente: `openclaw configure --section web`.

  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Exige uma sessão de usuário iniciada; para ambientes sem interface gráfica, use um LaunchDaemon personalizado (não fornecido).
    - Linux (e Windows via WSL2): unidade de usuário do systemd
      - A integração inicial tenta habilitar a permanência com `loginctl enable-linger <user>` para que o Gateway continue em execução após o logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); primeiro, tenta sem sudo.
    - Windows nativo: primeiro, uma Tarefa Agendada; se a criação da tarefa for negada, o OpenClaw usará como alternativa um item de login por usuário na pasta Inicializar e iniciará o Gateway imediatamente.
    - **Seleção do runtime:** Node (recomendado; obrigatório para WhatsApp/Telegram — o Bun pode corromper a memória ao reconectar). Somente o Node é oferecido interativamente; `--daemon-runtime bun` está disponível apenas pela CLI.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o validará, mas não persistirá valores resolvidos do token em texto simples nos metadados do ambiente do serviço supervisor.
    - Se a autenticação por token exigir um token e a SecretRef configurada para o token não puder ser resolvida, a instalação do daemon será bloqueada com orientações práticas.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.

  </Step>
  <Step title="Verificação de integridade">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - Dica: `openclaw status --deep` adiciona a sondagem de integridade em tempo real do Gateway à saída de status, incluindo sondagens de canais quando compatíveis (exige um Gateway acessível).

  </Step>
  <Step title="Skills (recomendado)">
    - Lê as skills disponíveis e verifica os requisitos.
    - Permite escolher um gerenciador de Node: **npm / pnpm / bun**.
    - Instala automaticamente dependências opcionais para skills integradas confiáveis (algumas usam o Homebrew no macOS).
    - Ignora skills cujo pré-requisito de instalação pelo Homebrew, uv ou Go não esteja disponível, agrupa-as com orientações de configuração manual e direciona você para `openclaw doctor` assim que o pré-requisito for instalado.

  </Step>
  <Step title="Conclusão">
    - Resumo + próximas etapas, incluindo a solicitação **Como você deseja iniciar seu agente?** para Terminal, Navegador ou mais tarde.

  </Step>
</Steps>

<Note>
Se nenhuma interface gráfica for detectada, a integração inicial exibirá instruções de encaminhamento de porta SSH para a interface de controle, em vez de abrir um navegador.
Se os recursos da interface de controle estiverem ausentes, a integração inicial tentará compilá-los; a alternativa é `pnpm ui:build` (instala automaticamente as dependências da interface).
</Note>

## Modo não interativo

Use `--non-interactive --accept-risk` para automatizar ou executar a integração inicial por script (a
opção é o reconhecimento de risco obrigatório; a integração inicial é encerrada com um erro
sem ela):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Adicione `--json` para obter um resumo legível por máquina.

SecretRef do token do Gateway no modo não interativo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.

<Note>
`--json` **não** implica o modo não interativo. Use `--non-interactive --accept-risk` (e `--workspace`) em scripts.
</Note>

Exemplos de comandos específicos de provedores estão em [Automação da CLI](/pt-BR/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referência para consultar a semântica das opções e a ordem das etapas.

### Adicionar agente (não interativo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` é um id de agente reservado e não pode ser usado com `openclaw agents add`.

## RPC do assistente do Gateway

O Gateway disponibiliza o fluxo de integração por RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Os clientes (aplicativo para macOS, interface de controle) podem renderizar as etapas sem reimplementar a lógica de integração.

## Configuração do Signal (signal-cli)

A integração detecta se `signal-cli` está no `PATH` e, caso esteja ausente, oferece a instalação:

- Linux x86-64: baixa a compilação nativa oficial do GraalVM das versões do `signal-cli` no GitHub e a armazena em `~/.openclaw/tools/signal-cli/<version>/`.
- macOS e outras arquiteturas: instala pelo Homebrew.
- Windows nativo: ainda não é compatível; execute a integração dentro do WSL2 para usar o caminho de instalação do Linux.
- Em qualquer caso, grava `channels.signal.cliPath` na sua configuração.

## O que o assistente grava

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando `--skip-bootstrap` é passado
- `agents.defaults.model` / `models.providers` (se o Minimax for escolhido)
- `tools.profile` (a integração local usa `"coding"` como padrão quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, vinculação, autenticação, Tailscale)
- `session.dmScope` (a integração local usa `"per-channel-peer"` como padrão quando não definido; valores explícitos existentes são preservados. Detalhes: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissões de mensagens diretas dos canais quando você opta por elas durante as solicitações de configuração dos canais. Discord, Matrix, Microsoft Teams e Slack resolvem nomes em IDs quando possível; outros canais recebem IDs diretamente (por exemplo, IDs numéricos de remetentes do Telegram ou números de telefone do WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A configuração manual ainda pode usar `yarn` definindo `skills.install.nodeManager` diretamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` grava `agents.list[]` e `bindings` opcionais.

As credenciais do WhatsApp ficam em `~/.openclaw/credentials/whatsapp/<accountId>/`.
As sessões ativas e as transcrições são armazenadas em
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. O diretório
`~/.openclaw/agents/<agentId>/sessions/` é usado para entradas de migração legadas
e artefatos de arquivamento/suporte.

Alguns canais são fornecidos como plugins. Quando você seleciona um durante a configuração, a integração
solicita sua instalação (via npm ou por um caminho local) antes que ele possa ser configurado.

## Documentação relacionada

- Visão geral da integração: [Integração (CLI)](/pt-BR/start/wizard)
- Referência de configuração da CLI: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference)
- Integração no aplicativo para macOS: [Integração](/pt-BR/start/onboarding)
- Referência de configuração: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Provedores: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord), [Google Chat](/pt-BR/channels/googlechat), [Signal](/pt-BR/channels/signal), [iMessage](/pt-BR/channels/imessage)
- Skills: [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config)
