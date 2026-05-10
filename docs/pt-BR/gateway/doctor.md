---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-10T19:34:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige configurações/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Modos headless e de automação

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Aceita padrões sem solicitar confirmação (incluindo etapas de reparo de reinicialização/serviço/sandbox quando aplicável).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica reparos recomendados sem solicitar confirmação (reparos + reinicializações quando seguro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Aplica também reparos agressivos (sobrescreve configurações personalizadas de supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinicialização/serviço/sandbox que exigem confirmação humana. Migrações de estado legado são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Varre serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as alterações antes de gravar, abra o arquivo de configuração primeiro:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização prévia opcional para instalações via git (apenas interativo).
    - Verificação de atualização do protocolo da UI (reconstrói a UI de Controle quando o schema do protocolo é mais novo).
    - Verificação de integridade + prompt de reinicialização.
    - Resumo de status de Skills (qualificadas/ausentes/bloqueadas) e status de Plugin.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração de fala de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração do navegador para configurações legadas de extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de shadowing do OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
    - Avisos de lista de permissões de Plugin/ferramenta quando `plugins.allow` é restritivo, mas a política de ferramentas ainda pede ferramentas curinga ou pertencentes a Plugin.
    - Migração de estado legado em disco (sessões/diretório do agente/autenticação do WhatsApp).
    - Migração de chaves de contrato de manifesto de Plugin legado (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração de armazenamento Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload no nível superior, payload `provider`, jobs de fallback de Webhook simples `notify: true`).
    - Limpeza de política de runtime legado para agente inteiro; a política de runtime de provedor/modelo é o seletor de rota ativo.
    - Limpeza de configuração obsoleta de Plugin quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas de Plugin são tratadas como configuração de contenção inerte e são preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de lock de sessão e limpeza de locks obsoletos.
    - Reparo de transcritos de sessão para ramificações duplicadas de reescrita de prompt criadas por builds 2026.4.24 afetadas.
    - Detecção de lápides de recuperação por reinicialização de subagente travado, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada, para que a inicialização não continue tratando o filho como abortado por reinicialização.
    - Verificações de integridade de estado e permissões (sessões, transcritos, diretório de estado).
    - Verificações de permissões do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação de modelo: verifica expiração de OAuth, pode renovar tokens prestes a expirar e relata estados de cooldown/desabilitado de perfil de autenticação.
    - Detecção de diretório extra de workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando o sandboxing está habilitado.
    - Migração de serviço legado e detecção de Gateway extra.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (sondados a partir do Gateway em execução).
    - Verificações de permissão específicas de canal ficam em `openclaw channels capabilities`; por exemplo, permissões de canal de voz do Discord são auditadas com `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Verificações de responsividade do WhatsApp para integridade degradada do loop de eventos do Gateway com clientes TUI locais ainda em execução; `--fix` para apenas clientes TUI locais verificados.
    - Reparo de rota do Codex para refs de modelo legadas `openai-codex/*` em modelos primários, fallbacks, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo de canal e pins de rota de sessão; `--fix` reescreve para `openai/*`, remove pins obsoletos de runtime de sessão/agente inteiro e deixa refs canônicas de agente OpenAI no harness Codex padrão.
    - Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza de ambiente de proxy incorporado para serviços Gateway que capturaram valores shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante instalação ou atualização.
    - Verificações de melhores práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciador de versão).
    - Diagnósticos de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas de DM abertas.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, divergência obsoleta de cache local de token de dispositivo e divergência de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; relata Skills permitidas com bins, env, configuração ou requisitos de SO ausentes, e `--fix` pode desabilitar Skills indisponíveis em `skills.entries`.
    - Verificação de status de preenchimento do shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Backfill e reset da UI de Dreams

A cena Dreams da UI de Controle inclui as ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de trabalho de grounded dreaming. Essas ações usam métodos RPC no estilo doctor do Gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** varre arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário grounded REM e grava entradas reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas marcadas de diário de backfill de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas staged de curto prazo exclusivamente grounded que vieram de replay histórico e ainda não acumularam recall ao vivo nem suporte diário.

O que elas **não** fazem por si só:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não colocam automaticamente candidatos grounded staged no armazenamento de promoção de curto prazo ao vivo, a menos que você execute explicitamente o caminho staged da CLI primeiro

Se quiser que o replay histórico grounded influencie a trilha normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso coloca candidatos duráveis grounded no armazenamento de dreaming de curto prazo, mantendo `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se isto for um checkout git e o doctor estiver sendo executado de forma interativa, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valor legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o schema atual.

    Isso inclui campos planos legados do Talk. A configuração pública atual de fala do Talk é `talk.provider` + `talk.providers.<provider>`, e a configuração de voz em tempo real é `talk.realtime.*`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` para o mapa de provedor, e reescreve seletores legados de tempo real no nível superior (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) para `talk.realtime`.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas de ferramentas curinga ou pertencentes a Plugin. `tools.allow: ["*"]` só corresponde a ferramentas
    de plugins que realmente carregam; ele não ignora a lista exclusiva de permissões de Plugin.
    O doctor grava `plugins.bundledDiscovery: "compat"` para configurações legadas migradas
    de lista de permissões a fim de preservar o comportamento existente de provedor integrado e
    depois aponta para a configuração mais estrita `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

    A inicialização do Gateway recusa formatos de configuração legados e pede que você execute `openclaw doctor --fix`; ela não reescreve `openclaw.json` na inicialização. Migrações de armazenamento de jobs Cron também são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurações de canais configurados sem política de resposta visível → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nível superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legados → `talk.provider` + `talk.providers.<provider>`
    - seletores legados de Talk em tempo real de nível superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` e `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` e `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` e `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` e `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Para canais com `accounts` nomeadas, mas com valores de canal de nível superior de conta única remanescentes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; o Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (ferramentas/elevado/exec/sandbox/subagentes)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para timeouts de provedor/modelo lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de relay da extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do Gateway também ignora provedores cujo `api` está definido como um valor de enum futuro ou desconhecido, em vez de falhar fechado)
    - remova `plugins.entries.codex.config.codexDynamicToolsProfile`; o servidor de app Codex sempre mantém as ferramentas de workspace nativas do Codex como nativas

    Os avisos do doctor também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração de navegador e prontidão do Chrome MCP">
    Se a configuração do seu navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de anexação Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O doctor também audita o caminho Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O doctor não pode habilitar a configuração no lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/nó
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui se refere apenas aos pré-requisitos de anexação local. Existing-session mantém os limites de rota atuais do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Eles continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos TLS de OAuth">
    Quando um perfil OAuth do OpenAI Codex é configurado, o doctor sonda o endpoint de autorização da OpenAI para verificar se a pilha TLS local de Node/OpenSSL consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientação de correção específica da plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo se o gateway estiver íntegro.
  </Accordion>
  <Accordion title="2e. Substituições de provedor OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem sombrear o caminho integrado do provedor OAuth do Codex que versões mais novas usam automaticamente. O doctor avisa quando detecta essas configurações antigas de transporte junto com o OAuth do Codex, para que você possa remover ou reescrever a substituição obsoleta de transporte e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições somente de cabeçalho ainda são aceitos e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Reparo de rota do Codex">
    O doctor verifica referências legadas de modelo `openai-codex/*`. O roteamento nativo do harness Codex usa referências canônicas de modelo `openai/*`; turnos de agentes OpenAI passam pelo harness do servidor de app Codex em vez do caminho OpenAI do OpenClaw PI.

    No modo `--fix` / `--repair`, o doctor reescreve referências afetadas de agente padrão e por agente, incluindo modelos primários, fallbacks, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo por canal e estado obsoleto de rota de sessão persistida:

    - `openai-codex/gpt-*` se torna `openai/gpt-*`.
    - A intenção do Codex se move para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo para referências de modelo de agente reparadas, para que perfis de autenticação `openai-codex:...` ainda possam ser selecionados depois que a referência de modelo se torna `openai/*`.
    - A configuração obsoleta de runtime de agente inteiro e os pins de runtime de sessão persistida são removidos porque a seleção de runtime tem escopo de provedor/modelo.
    - A política existente de runtime de provedor/modelo é preservada, a menos que a referência legada de modelo reparada precise do roteamento Codex para manter o caminho antigo de autenticação.
    - As listas existentes de fallback de modelos são preservadas com suas entradas legadas reescritas; configurações por modelo copiadas se movem da chave legada para a chave canônica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de fallback e pins de perfil de autenticação de sessões persistidas são reparados em todos os armazenamentos de sessão de agente descobertos.
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex a partir do chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx."

  </Accordion>
  <Accordion title="2g. Limpeza de rota de sessão">
    O doctor também verifica os armazenamentos de sessão de agente descobertos em busca de estado obsoleto de rota criado automaticamente depois que você move modelos configurados ou runtime para longe de uma rota pertencente a Plugin, como o Codex.

    `openclaw doctor --fix` pode limpar estado obsoleto criado automaticamente, como pins de modelo `modelOverrideSource: "auto"`, metadados de modelo de runtime, IDs fixados de harness, vinculações de sessão da CLI e substituições automáticas de perfil de autenticação quando a rota proprietária deles não está mais configurada. Escolhas explícitas de usuário ou de modelo de sessão legada são relatadas para revisão manual e deixadas intactas; altere-as com `/model ...`, `/new` ou redefina a sessão quando essa rota não for mais desejada.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O doctor pode migrar layouts antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (id da conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando deixar pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente as sessões legadas + o diretório do agente na inicialização, para que histórico/autenticação/modelos cheguem ao caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores do Talk agora compara por igualdade estrutural, então diffs apenas de ordem de chaves não acionam mais alterações repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifesto legado de Plugin">
    O doctor verifica todos os manifestos de Plugin instalados em busca de chaves de capacidade obsoletas de nível superior (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Esta migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada é removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações de armazenamento Cron legado">
    O doctor também verifica o armazenamento de trabalhos cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de trabalho que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` do payload → `delivery.channel` explícito
    - jobs simples legados de fallback de webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O Doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem alterar o comportamento. Se um job combina o fallback legado de notify com um modo de entrega existente que não seja webhook, o Doctor avisa e deixa esse job para revisão manual.

    No Linux, o Doctor também avisa quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local do host não é mantido pelo OpenClaw atual e pode gravar falsas mensagens `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para as verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueio de sessão">
    O Doctor verifica todos os diretórios de sessão de agentes em busca de arquivos de bloqueio de escrita obsoletos — arquivos deixados para trás quando uma sessão saiu de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata: o caminho, o PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID morto, mais antigo que 30 minutos ou um PID ativo que comprovadamente pertence a um processo que não é do OpenClaw). No modo `--fix` / `--repair`, ele remove automaticamente os arquivos de bloqueio obsoletos; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    O Doctor verifica arquivos JSONL de sessão de agentes em busca da forma de ramificação duplicada criada pelo bug de reescrita da transcrição de prompt de 2026.4.24: um turno de usuário abandonado com contexto interno de runtime do OpenClaw mais um irmão ativo contendo o mesmo prompt de usuário visível. No modo `--fix` / `--repair`, o Doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do Gateway e os leitores de memória não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O Doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não consegue recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a capacidade de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma divergência de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com nuvem no macOS**: avisa quando o estado resolve sob iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos apoiados por sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado resolve para uma origem de montagem `mmcblk*`, porque E/S aleatória apoiada por SD ou eMMC pode ser mais lenta e desgastar mais rápido com gravações de sessão e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são obrigatórios para persistir o histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: avisa quando entradas de sessão recentes têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está acumulando).
    - **Vários diretórios de estado**: avisa quando várias pastas `~/.openclaw` existem em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o Doctor lembra você de executá-lo no host remoto (o estado vive lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` é legível por grupo/mundo e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade de autenticação de modelo (expiração OAuth)">
    O Doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de setup-token da Anthropic. Prompts de atualização aparecem apenas ao executar interativamente (TTY); `--non-interactive` pula tentativas de atualização.

    Quando uma atualização OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para você fazer login novamente), o Doctor informa que a reautenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a executar.

    O Doctor também relata perfis de autenticação que estão temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o Doctor valida a referência do modelo contra o catálogo e a lista de permissões e avisa quando ela não resolve ou não é permitida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandboxing está habilitado, o Doctor verifica imagens Docker e oferece compilar ou alternar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugin">
    O Doctor remove o estado legado de preparo de dependências de Plugin gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes obsoletas de dependências geradas, diretórios antigos de estágio de instalação, resíduos locais de pacote de código anterior de reparo de dependências de plugins empacotados e cópias npm gerenciadas órfãs ou recuperadas de plugins `@openclaw/*` empacotados que podem sombrear o manifesto empacotado atual.

    O Doctor também pode reinstalar plugins baixáveis ausentes quando a configuração os referencia, mas o registro local de Plugin não consegue encontrá-los. Exemplos incluem `plugins.entries` materiais, configurações configuradas de canal/provedor/busca e runtimes de agentes configurados. Durante atualizações de pacote, o Doctor evita executar reparo de Plugin por gerenciador de pacotes enquanto o pacote principal está sendo trocado; execute `openclaw doctor --fix` novamente após a atualização se um Plugin configurado ainda precisar de recuperação. A inicialização do Gateway e o recarregamento de configuração não executam gerenciadores de pacotes; instalações de Plugin continuam sendo trabalho explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O Doctor detecta serviços legados do Gateway (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço do OpenClaw usando a porta atual do Gateway. Ele também pode verificar serviços extras semelhantes ao Gateway e imprimir dicas de limpeza. Serviços do Gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras."

    No Linux, se o serviço do Gateway em nível de usuário estiver ausente, mas existir um serviço do Gateway do OpenClaw em nível de sistema, o Doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`, depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor de sistema possuir o ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o Doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), esta verificação é pulada por completo.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivo e desvio de autenticação">
    O Doctor agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de integridade.

    O que ele relata:

    - solicitações pendentes de pareamento inicial
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o ID do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos se desviam da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual que antecedem uma rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

    O Doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e aprove novamente um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pareamento obrigatório": o Doctor agora distingue pareamento inicial de upgrades pendentes de função/escopo e de desvio obsoleto de token/identidade do dispositivo.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O Doctor emite avisos quando um provedor está aberto a DMs sem uma lista de permissões, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. linger do systemd (Linux)">
    Se estiver executando como um serviço de usuário systemd, o Doctor garante que lingering esteja habilitado para que o Gateway permaneça ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do workspace (Skills, plugins e diretórios legados)">
    O Doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas pela lista de permissões.
    - **Diretórios de workspace legados**: avisa quando `~/openclaw` ou outros diretórios de workspace legados existem ao lado do workspace atual.
    - **Status de Plugin**: conta plugins habilitados/desabilitados/com erro; lista IDs de Plugin para quaisquer erros; relata capacidades de plugins empacotados.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros de carregamento emitidos pelo registro de Plugin.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O Doctor verifica se os arquivos de bootstrap do workspace (por exemplo, `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele relata, por arquivo, contagens de caracteres brutos versus injetados, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e caracteres injetados totais como uma fração do orçamento total. Quando arquivos são truncados ou estão perto do limite, o Doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de Plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um Plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse Plugin: entradas `channels.<id>`, alvos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal desapareceu, mas a configuração ainda pede que o Gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Compleção de shell">
    O Doctor verifica se a completação por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão lento de completação dinâmica (`source <(openclaw completion ...)`), o Doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se a completação está configurada no perfil, mas o arquivo de cache está ausente, o Doctor regenera o cache automaticamente.
    - Se nenhuma completação está configurada, o Doctor solicita instalá-la (somente modo interativo; pulado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O doctor verifica a prontidão da autenticação por token do gateway local.

    - Se o modo de token precisar de um token e nenhuma fonte de token existir, o doctor oferece gerar um.
    - Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida em tempo de execução.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família de status para reparos de configuração direcionados.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais de bot configuradas quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor informa que a credencial está configurada, porém indisponível, e ignora a resolução automática em vez de falhar ou informar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinicialização">
    O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece não estar íntegro.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O doctor verifica se o provedor de embeddings de busca de memória configurado está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientações de correção incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL de modelo remota/baixável reconhecida. Se estiver ausente, sugere alternar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sondagem do gateway em cache está disponível (o gateway estava íntegro no momento da verificação), o doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status profundo de memória quando quiser uma verificação de provedor em tempo real.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em tempo de execução.

  </Accordion>
  <Accordion title="14. Avisos de status de canais">
    Se o gateway estiver íntegro, o doctor executa uma sondagem de status de canais e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração do supervisor instalada (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e atraso de reinício). Quando encontra uma divergência, recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita os prompts de reparo padrão.
    - `openclaw doctor --repair` aplica as correções recomendadas sem prompts.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço do gateway. Ele ainda relata a integridade do serviço e executa reparos não relacionados ao serviço, mas ignora instalação/início/reinício/bootstrap do serviço, reescritas da configuração do supervisor e limpeza de serviços legados porque um supervisor externo é dono desse ciclo de vida.
    - No Linux, o doctor não reescreve metadados de comando/entrypoint enquanto a unidade systemd de gateway correspondente está ativa. Ele também ignora unidades extras inativas não legadas semelhantes a gateway durante a varredura de serviços duplicados, para que arquivos de serviço complementares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo de serviço do doctor valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço do supervisor.
    - O doctor detecta valores de ambiente de serviço gerenciados por `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Tarefa Agendada do Windows incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da fonte de runtime em vez da definição do supervisor.
    - O doctor detecta quando o comando do serviço ainda fixa um `--port` antigo depois que `gateway.port` muda e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, o doctor bloqueia o caminho de instalação/reparo com orientação acionável.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd no Linux, as verificações de divergência de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Reparos de serviço do doctor se recusam a reescrever, parar ou reiniciar um serviço de gateway de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais recente. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do gateway (padrão `18789`) e relata causas prováveis (gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Melhores práticas de runtime do Gateway">
    O doctor avisa quando o serviço de gateway é executado no Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH canônico do sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, para que binários de sistema gerenciados pelo Homebrew permaneçam disponíveis enquanto Volta, asdf, fnm, pnpm e outros diretórios de gerenciadores de versão não alterem qual Node os processos filhos resolvem. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios de fallback inferidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem no disco.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O doctor persiste quaisquer alterações de configuração e carimba metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre estrutura de workspace e backup com git (GitHub ou GitLab privado recomendado).

  </Accordion>
</AccordionGroup>

## Relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
