---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introduzindo alterações de configuração incompatíveis
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-07T13:17:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige configurações/estados obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

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

    Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de reinício/serviço/sandbox quando aplicável).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica os reparos recomendados sem solicitar confirmação (reparos + reinícios quando seguro).

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

    Executa sem prompts e aplica somente migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinício/serviço/sandbox que exigem confirmação humana. Migrações de estado legado são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Examina serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização opcional pré-execução para instalações via git (somente interativo).
    - Verificação de atualização do protocolo da UI (recompila a Control UI quando o esquema do protocolo é mais novo).
    - Verificação de integridade + prompt de reinício.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de plugin.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração de Talk dos campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração de navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
    - Avisos de allowlist de plugins/ferramentas quando `plugins.allow` é restritivo, mas a política de ferramentas ainda solicita curinga ou ferramentas pertencentes a plugins.
    - Migração de estado legado em disco (sessões/diretório do agente/autenticação do WhatsApp).
    - Migração de chaves legadas do contrato de manifesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração da loja Cron legada (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, payload `provider`, jobs simples de fallback de webhook `notify: true`).
    - Migração legada da política de runtime do agente para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Limpeza de configuração obsoleta de plugins quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas a plugins são tratadas como configuração de contenção inerte e preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcrições de sessão para branches duplicados de reescrita de prompt criados por builds afetados de 2026.4.24.
    - Detecção de tombstone de recuperação de reinício de subagente travado, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada, para que a inicialização não continue tratando o filho como abortado por reinício.
    - Verificações de integridade de estado e permissões (sessões, transcrições, diretório de estado).
    - Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação de modelos: verifica expiração do OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desabilitado de perfis de autenticação.
    - Detecção de diretório extra de workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando o sandboxing está habilitado.
    - Migração de serviço legado e detecção de Gateway extra.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (sondados a partir do Gateway em execução).
    - Verificações de permissão específicas de canal ficam em `openclaw channels capabilities`; por exemplo, permissões de canal de voz do Discord são auditadas com `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Verificações de responsividade do WhatsApp para integridade degradada do loop de eventos do Gateway com clientes TUI locais ainda em execução; `--fix` interrompe somente clientes TUI locais verificados.
    - Reparo de rota do Codex para refs legadas de modelo `openai-codex/*` em modelos primários, fallbacks, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo de canal e pins de rota de sessão; `--fix` as reescreve para `openai/*` e seleciona `agentRuntime.id: "codex"` somente quando o plugin Codex está instalado, habilitado, contribui com o harness `codex` e tem OAuth utilizável. Caso contrário, seleciona `agentRuntime.id: "pi"`.
    - Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza de ambiente de proxy embutido para serviços Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de boas práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciador de versão).
    - Diagnósticos de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas de DM abertas.
    - Verificações de autenticação do Gateway para o modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, desvio obsoleto do cache local de tokens de dispositivo e desvio de autenticação do registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; relata skills permitidas com bins, env, config ou requisitos de SO ausentes, e `--fix` pode desabilitar skills indisponíveis em `skills.entries`.
    - Verificação de status de conclusão do shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, ativos da UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Backfill e reset da UI de Dreams

A cena Dreams da Control UI inclui ações de **Preencher retroativamente**, **Redefinir** e **Limpar fundamentado** para o fluxo de trabalho de dreaming fundamentado. Essas ações usam métodos RPC no estilo do doctor do Gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Preencher retroativamente** examina arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM fundamentado e grava entradas reversíveis de backfill em `DREAMS.md`.
- **Redefinir** remove de `DREAMS.md` somente essas entradas marcadas de diário de backfill.
- **Limpar fundamentado** remove somente entradas encenadas de curto prazo exclusivamente fundamentadas que vieram de replay histórico e ainda não acumularam recall ao vivo nem suporte diário.

O que elas **não** fazem por si só:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não encenam automaticamente candidatos fundamentados na loja de promoção de curto prazo ao vivo, a menos que você execute explicitamente primeiro o caminho encenado da CLI

Se quiser que o replay histórico fundamentado influencie a faixa normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso encena candidatos duráveis fundamentados na loja de dreaming de curto prazo, mantendo `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se este for um checkout git e o doctor estiver executando interativamente, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valores legados (por exemplo `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o esquema atual.

    Isso inclui campos planos legados de Talk. A configuração pública atual de fala do Talk é `talk.provider` + `talk.providers.<provider>`, e a configuração de voz em tempo real é `talk.realtime.*`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` para o mapa de provedores, e reescreve seletores legados de tempo real de nível superior (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) para `talk.realtime`.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas curinga ou de ferramentas pertencentes a plugins. `tools.allow: ["*"]` corresponde somente a ferramentas
    de plugins que realmente são carregados; ele não contorna a allowlist exclusiva de plugins.
    O doctor grava `plugins.bundledDiscovery: "compat"` para configurações legadas migradas de allowlist
    a fim de preservar o comportamento existente de provedores empacotados, e
    então aponta para a configuração mais estrita `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrações de chaves legadas de configuração">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem para você executar `openclaw doctor`.

    O doctor vai:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

    A inicialização do Gateway recusa formatos legados de configuração e pede para você executar `openclaw doctor --fix`; ela não reescreve `openclaw.json` na inicialização. Migrações da loja de jobs Cron também são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurações de canais configurados sem política de resposta visível → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` no nível superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legados → `talk.provider` + `talk.providers.<provider>`
    - seletores realtime Talk legados no nível superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Para canais com `accounts` nomeadas, mas valores de canal de conta única no nível superior ainda presentes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para timeouts lentos de provedor/modelo
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de retransmissão de extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do Gateway também ignora provedores cujo `api` está definido como um valor de enum futuro ou desconhecido, em vez de falhar fechado)

    Os avisos do doctor também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração do navegador e prontidão do Chrome MCP">
    Se a configuração do navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de anexação local ao host do Chrome MCP:

    - `browser.profiles.*.driver: "extension"` vira `"existing-session"`
    - `browser.relayBindHost` é removido

    O doctor também audita o caminho local ao host do Chrome MCP quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela é inferior ao Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/node
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui trata apenas dos pré-requisitos de anexação local. Existing-session mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de downloads e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Esses continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor consulta o endpoint de autorização da OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue validar a cadeia de certificados. Se a consulta falhar com um erro de certificado (por exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientação de correção específica da plataforma. No macOS com Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a consulta é executada mesmo que o gateway esteja saudável.
  </Accordion>
  <Accordion title="2e. Substituições de provedor OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem sombrear o caminho integrado do provedor OAuth do Codex que versões mais recentes usam automaticamente. O doctor avisa quando encontra essas configurações antigas de transporte junto com OAuth do Codex para que você possa remover ou reescrever a substituição de transporte obsoleta e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições apenas de cabeçalho continuam compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Reparo de rota do Codex">
    O doctor verifica refs legadas de modelo `openai-codex/*`. O roteamento nativo do harness Codex usa refs canônicas de modelo `openai/*`; turnos de agente OpenAI passam pelo harness app-server do Codex em vez do caminho OpenClaw PI OpenAI.

    No modo `--fix` / `--repair`, o doctor reescreve refs afetadas do agente padrão e por agente, incluindo modelos primários, fallbacks, substituições de heartbeat/subagent/compaction, hooks, substituições de modelo por canal e estado de rota obsoleto persistido de sessões:

    - `openai-codex/gpt-*` vira `openai/gpt-*`.
    - O runtime de agente correspondente vira `agentRuntime.id: "codex"` somente quando o Codex está instalado, habilitado, contribui o harness `codex` e tem OAuth utilizável.
    - Caso contrário, o runtime de agente correspondente vira `agentRuntime.id: "pi"`.
    - Listas existentes de fallback de modelo são preservadas com as entradas legadas reescritas; configurações copiadas por modelo são movidas da chave legada para a chave canônica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de fallback, pins de perfil de autenticação e pins de harness Codex persistidos de sessão são reparados em todos os armazenamentos de sessão de agente descobertos.
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex pelo chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx."

  </Accordion>
  <Accordion title="2g. Limpeza de rota de sessão">
    O doctor também examina armazenamentos de sessão de agente descobertos em busca de estado de rota obsoleto criado automaticamente depois que você move modelos configurados ou runtime para longe de uma rota pertencente a Plugin, como Codex.

    `openclaw doctor --fix` pode limpar estado obsoleto criado automaticamente, como pins de modelo `modelOverrideSource: "auto"`, metadados de modelo de runtime, IDs de harness fixados, vínculos de sessão da CLI e substituições automáticas de perfil de autenticação quando a rota proprietária deles não está mais configurada. Escolhas explícitas de usuário ou de modelo de sessão legado são relatadas para revisão manual e deixadas intactas; alterne-as com `/model ...`, `/new` ou redefina a sessão quando essa rota não for mais desejada.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O doctor pode migrar layouts mais antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório de agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (id de conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando deixar pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente o diretório legado de sessões + agente na inicialização, para que histórico/autenticação/modelos fiquem no caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é migrada intencionalmente apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores do Talk agora compara por igualdade estrutural, então diffs apenas de ordem de chaves não acionam mais alterações repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações legadas de manifesto de Plugin">
    O doctor examina todos os manifestos de Plugin instalados em busca de chaves de capacidade obsoletas no nível superior (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Essa migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada é removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações legadas de armazenamento do cron">
    O doctor também verifica o armazenamento de jobs do cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de job que o agendador ainda aceita por compatibilidade.

    As limpezas atuais do cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload no nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega no nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` do payload → `delivery.channel` explícito
    - jobs simples legados de fallback de webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O doctor só migra automaticamente tarefas `notify: true` quando consegue fazer isso sem alterar o comportamento. Se uma tarefa combina fallback de notify legado com um modo de entrega não Webhook existente, o doctor avisa e deixa essa tarefa para revisão manual.

    No Linux, o doctor também avisa quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local do host não é mantido pelo OpenClaw atual e pode gravar mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueio de sessão">
    O doctor verifica todos os diretórios de sessão de agente em busca de arquivos de bloqueio de escrita obsoletos — arquivos deixados para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata: o caminho, PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`, ele remove automaticamente arquivos de bloqueio obsoletos; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de branch de transcrição de sessão">
    O doctor verifica arquivos JSONL de sessão de agente em busca do formato de branch duplicado criado pelo bug de reescrita de transcrição de prompt de 2026.4.24: uma rodada de usuário abandonada com contexto de runtime interno do OpenClaw mais uma irmã ativa contendo o mesmo prompt visível do usuário. No modo `--fix` / `--repair`, o doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a branch ativa, para que o histórico do Gateway e os leitores de memória não vejam mais rodadas duplicadas.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que ele não consegue recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a capacidade de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma incompatibilidade de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com nuvem no macOS**: avisa quando o estado resolve para dentro do iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado resolve para uma origem de montagem `mmcblk*`, porque E/S aleatória em SD ou eMMC pode ser mais lenta e desgastar mais rápido sob escritas de sessão e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessão são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: avisa quando entradas de sessão recentes têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está acumulando).
    - **Vários diretórios de estado**: avisa quando várias pastas `~/.openclaw` existem em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo no host remoto (o estado vive lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` é legível por grupo/todos e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade de autenticação de modelo (expiração de OAuth)">
    O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de token de configuração da Anthropic. Prompts de atualização só aparecem ao executar interativamente (TTY); `--non-interactive` ignora tentativas de atualização.

    Quando uma atualização OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para você entrar novamente), o doctor relata que a reautenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a executar.

    O doctor também relata perfis de autenticação que estão temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo contra o catálogo e a allowlist e avisa quando ela não será resolvida ou for proibida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandboxing está habilitado, o doctor verifica imagens Docker e oferece criar ou trocar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugin">
    O doctor remove o estado legado de staging de dependências de Plugin gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes de dependências geradas obsoletas, diretórios antigos de estágio de instalação, resíduos locais de pacote de código anterior de reparo de dependências de Plugins agrupados e cópias npm gerenciadas órfãs ou recuperadas de Plugins `@openclaw/*` agrupados que podem sombrear o manifesto agrupado atual.

    O doctor também pode reinstalar Plugins baixáveis ausentes quando a configuração os referencia, mas o registro local de Plugin não consegue encontrá-los. Exemplos incluem `plugins.entries` materiais, configurações de canal/provedor/pesquisa configuradas e runtimes de agente configurados. Durante atualizações de pacote, o doctor evita executar reparo de Plugin pelo gerenciador de pacotes enquanto o pacote core está sendo trocado; execute `openclaw doctor --fix` novamente após a atualização se um Plugin configurado ainda precisar de recuperação. Inicialização do Gateway e recarregamento de configuração não executam gerenciadores de pacotes; instalações de Plugin continuam sendo trabalho explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O doctor detecta serviços legados do Gateway (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenClaw usando a porta atual do Gateway. Ele também pode verificar serviços extras semelhantes ao Gateway e imprimir dicas de limpeza. Serviços do Gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras".

    No Linux, se o serviço do Gateway em nível de usuário estiver ausente, mas existir um serviço do Gateway do OpenClaw em nível de sistema, o doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`, depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor de sistema for dono do ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração em melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é totalmente ignorada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivo e desvio de autenticação">
    O doctor agora inspeciona o estado de pareamento de dispositivo como parte da passagem normal de integridade.

    O que ele relata:

    - solicitações pendentes de primeiro pareamento
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos desviam para fora da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual que são anteriores a uma rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

    O doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime os próximos passos exatos:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e aprove novamente um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pareamento obrigatório": agora o doctor distingue primeiro pareamento de upgrades pendentes de função/escopo e de desvio de token/identidade de dispositivo obsoleto.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O doctor emite avisos quando um provedor está aberto a DMs sem uma allowlist, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. Linger do systemd (Linux)">
    Se estiver executando como um serviço de usuário systemd, o doctor garante que lingering esteja habilitado para que o Gateway permaneça ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do workspace (Skills, Plugins e diretórios legados)">
    O doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
    - **Diretórios de workspace legados**: avisa quando `~/openclaw` ou outros diretórios de workspace legados existem junto ao workspace atual.
    - **Status de Plugin**: conta Plugins habilitados/desabilitados/com erro; lista IDs de Plugin para quaisquer erros; relata capacidades de Plugin agrupado.
    - **Avisos de compatibilidade de Plugin**: sinaliza Plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros em tempo de carregamento emitidos pelo registro de Plugin.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O doctor verifica se arquivos de bootstrap do workspace (por exemplo `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele relata contagens de caracteres brutos vs. injetados por arquivo, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e caracteres injetados totais como fração do orçamento total. Quando arquivos são truncados ou estão próximos do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de Plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um Plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse Plugin: entradas `channels.<id>`, alvos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal não existe mais, mas a configuração ainda pede que o Gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Autocompletar do shell">
    O doctor verifica se a conclusão por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão lento de conclusão dinâmica (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se a conclusão está configurada no perfil, mas o arquivo de cache está ausente, o doctor regenera o cache automaticamente.
    - Se nenhuma conclusão está configurada, o doctor solicita instalá-la (somente modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O doctor verifica a prontidão da autenticação por token local do Gateway.

    - Se o modo de token precisa de um token e nenhuma origem de token existe, o doctor oferece gerar um.
    - Se `gateway.auth.token` é gerenciado por SecretRef, mas está indisponível, o doctor avisa e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida em tempo de execução.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família de status para reparos direcionados de configuração.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar as credenciais configuradas do bot quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor informa que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de falhar ou informar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade + reinicialização do Gateway">
    O doctor executa uma verificação de integridade e oferece reiniciar o Gateway quando ele parece não estar saudável.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O doctor verifica se o provedor de embeddings de busca de memória configurado está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL de modelo remoto/baixável reconhecida. Se estiver ausente, sugere alternar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sondagem do Gateway em cache está disponível (o Gateway estava saudável no momento da verificação), o doctor cruza esse resultado com a configuração visível pela CLI e observa qualquer discrepância. O doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status de memória profundo quando quiser uma verificação ativa do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em tempo de execução.

  </Accordion>
  <Accordion title="14. Avisos de status de canais">
    Se o Gateway estiver saudável, o doctor executa uma sondagem de status de canais e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências de network-online do systemd e atraso de reinicialização). Quando encontra uma incompatibilidade, ele recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa com os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita as solicitações de reparo padrão.
    - `openclaw doctor --repair` aplica correções recomendadas sem solicitações.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço do Gateway. Ele ainda relata a integridade do serviço e executa reparos que não são de serviço, mas ignora instalação/início/reinicialização/bootstrap do serviço, reescritas de configuração do supervisor e limpeza de serviços legados porque um supervisor externo controla esse ciclo de vida.
    - No Linux, o doctor não reescreve metadados de comando/ponto de entrada enquanto a unidade systemd do Gateway correspondente está ativa. Ele também ignora unidades extras inativas semelhantes ao Gateway que não sejam legadas durante a varredura de serviços duplicados, para que arquivos de serviço complementares não criem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço do supervisor.
    - O doctor detecta valores de ambiente de serviço gerenciados por `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Windows Scheduled Task incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da fonte de runtime em vez da definição do supervisor.
    - O doctor detecta quando o comando de serviço ainda fixa uma `--port` antiga após alterações em `gateway.port` e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientação acionável.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades systemd de usuário no Linux, as verificações de desvio de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Reparos de serviço do doctor se recusam a reescrever, parar ou reiniciar um serviço de Gateway de um binário antigo do OpenClaw quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do Gateway (padrão `18789`) e relata causas prováveis (Gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Melhores práticas de runtime do Gateway">
    O doctor avisa quando o serviço do Gateway é executado no Bun ou em um caminho do Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node, e caminhos de gerenciador de versões podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH canônico do sistema (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, para que Volta, asdf, fnm, pnpm e outros diretórios de gerenciadores de versão não alterem qual Node é resolvido por processos filhos. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios de fallback estimados de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem em disco.

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
