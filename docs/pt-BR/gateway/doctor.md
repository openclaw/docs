---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-07T01:52:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
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

    Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de reinicialização/serviço/sandbox quando aplicável).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica os reparos recomendados sem solicitar confirmação (reparos + reinicializações quando seguro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Também aplica reparos agressivos (sobrescreve configurações personalizadas de supervisor).

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

    Examina serviços do sistema em busca de instalações adicionais do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização opcional de pré-verificação para instalações via git (somente interativo).
    - Verificação de atualização do protocolo da UI (recompila a Control UI quando o esquema de protocolo é mais recente).
    - Verificação de integridade + prompt de reinicialização.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de Plugin.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração de configuração do Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
    - Avisos de lista de permissões de Plugin/ferramenta quando `plugins.allow` é restritivo, mas a política de ferramentas ainda solicita curinga ou ferramentas pertencentes a Plugin.
    - Migração de estado legado em disco (sessões/diretório do agente/autenticação do WhatsApp).
    - Migração de chaves legadas do contrato de manifesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração do armazenamento de cron legado (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, payload `provider`, trabalhos Webhook de fallback simples `notify: true`).
    - Migração da política de runtime de agente legada para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Limpeza de configuração obsoleta de Plugin quando Plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas a Plugin são tratadas como configuração de contenção inerte e preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcrições de sessão para ramificações duplicadas de reescrita de prompt criadas por builds 2026.4.24 afetados.
    - Detecção de tombstone de recuperação por reinicialização de subagente travado, com suporte a `--fix` para limpar sinalizadores obsoletos de recuperação abortada para que a inicialização não continue tratando o filho como abortado por reinicialização.
    - Verificações de integridade de estado e permissões (sessões, transcrições, diretório de estado).
    - Verificações de permissões do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação de modelo: verifica expiração de OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desabilitado do perfil de autenticação.
    - Detecção de diretório de workspace extra (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando o sandboxing está habilitado.
    - Migração de serviço legado e detecção de Gateway adicional.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (sondados a partir do Gateway em execução).
    - Verificações de responsividade do WhatsApp para integridade degradada do event-loop do Gateway com clientes TUI locais ainda em execução; `--fix` interrompe apenas clientes TUI locais verificados.
    - Reparo de rota do Codex para refs de modelo legadas `openai-codex/*` em modelos primários, fallbacks, substituições de Heartbeat/subagente/Compaction, hooks, substituições de modelo de canal e pins de rota de sessão; `--fix` as reescreve para `openai/*` e seleciona `agentRuntime.id: "codex"` somente quando o Plugin Codex está instalado, habilitado, contribui com o harness `codex` e tem OAuth utilizável. Caso contrário, seleciona `agentRuntime.id: "pi"`.
    - Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza de ambiente de proxy incorporado para serviços Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de melhores práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciador de versões).
    - Diagnósticos de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas de DM abertas.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, desvio obsoleto de cache local de token de dispositivo e desvio de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/quase limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; relata Skills permitidas com binários, env, configuração ou requisitos de SO ausentes, e `--fix` pode desabilitar Skills indisponíveis em `skills.entries`.
    - Verificação de status de conclusão de shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embedding de pesquisa de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Backfill e redefinição da UI Dreams

A cena Dreams da Control UI inclui ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de trabalho grounded dreaming. Essas ações usam métodos RPC no estilo doctor do Gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** examina arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem do diário REM grounded e grava entradas reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas marcadas de diário de backfill de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas staged de curto prazo somente grounded que vieram de replay histórico e ainda não acumularam recall ao vivo nem suporte diário.

O que elas **não** fazem por si mesmas:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não colocam automaticamente candidatos grounded em stage no armazenamento de promoção de curto prazo ao vivo, a menos que você execute explicitamente primeiro o caminho staged da CLI

Se quiser que o replay histórico grounded influencie a trilha normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso coloca candidatos duráveis grounded em stage no armazenamento de Dreaming de curto prazo, mantendo `DREAMS.md` como superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações git)">
    Se este for um checkout git e o doctor estiver sendo executado interativamente, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valores legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o esquema atual.

    Isso inclui campos planos legados do Talk. A configuração pública atual de fala do Talk é `talk.provider` + `talk.providers.<provider>`, e a configuração de voz em tempo real é `talk.realtime.*`. O Doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` para o mapa de provedores, e reescreve seletores legados de tempo real de nível superior (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) para `talk.realtime`.

    O Doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas de ferramentas curinga ou pertencentes a Plugin. `tools.allow: ["*"]` corresponde apenas a ferramentas
    de Plugins que realmente carregam; ele não ignora a lista de permissões exclusiva de Plugin.
    O Doctor grava `plugins.bundledDiscovery: "compat"` para configurações legadas
    migradas de lista de permissões a fim de preservar o comportamento existente de provedores agrupados, e
    então aponta para a configuração mais estrita `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O Doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

    A inicialização do Gateway recusa formatos de configuração legados e pede que você execute `openclaw doctor --fix`; ela não reescreve `openclaw.json` na inicialização. Migrações do armazenamento de trabalhos Cron também são tratadas por `openclaw doctor --fix`.

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
    - seletores Talk em tempo real legados de nível superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Para canais com `accounts` nomeadas, mas com valores de canal de nível superior de conta única remanescentes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para timeouts de providers/modelos lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada do relay da extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do Gateway também ignora providers cujo `api` está definido como um valor enum futuro ou desconhecido, em vez de falhar de forma fechada)

    Os avisos do Doctor também incluem orientação de conta padrão para canais com múltiplas contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provider OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O Doctor avisa para que você possa remover a substituição e restaurar o roteamento de API por modelo + custos.
  </Accordion>
  <Accordion title="2c. Migração do navegador e prontidão do Chrome MCP">
    Se sua configuração de navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de anexação Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O Doctor também audita o caminho Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O Doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/node
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui trata apenas dos pré-requisitos de anexação local. Existing-session mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de downloads e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Eles continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint de autorização da OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientação de correção específica por plataforma. No macOS com um Node do Homebrew, a correção normalmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo que o gateway esteja íntegro.
  </Accordion>
  <Accordion title="2e. Substituições de provider OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem mascarar o caminho do provider OAuth do Codex integrado que versões mais novas usam automaticamente. O Doctor avisa quando vê essas configurações antigas de transporte junto com o OAuth do Codex, para que você possa remover ou reescrever a substituição obsoleta de transporte e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições somente de cabeçalho ainda são compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Reparo de rota do Codex">
    O Doctor verifica refs de modelo `openai-codex/*` legadas. O roteamento nativo do harness Codex usa refs de modelo canônicas `openai/*` mais `agentRuntime.id: "codex"` para que a rodada passe pelo harness do servidor de app do Codex em vez do caminho OpenAI do OpenClaw PI.

    No modo `--fix` / `--repair`, o doctor reescreve refs afetadas de agente padrão e por agente, incluindo modelos primários, fallbacks, substituições de heartbeat/subagent/compaction, hooks, substituições de modelo de canal e estado de rota de sessão persistida obsoleto:

    - `openai-codex/gpt-*` se torna `openai/gpt-*`.
    - O runtime de agente correspondente se torna `agentRuntime.id: "codex"` somente quando o Codex está instalado, habilitado, contribui o harness `codex` e tem OAuth utilizável.
    - Caso contrário, o runtime de agente correspondente se torna `agentRuntime.id: "pi"`.
    - Listas existentes de fallback de modelo são preservadas com suas entradas legadas reescritas; configurações copiadas por modelo se movem da chave legada para a chave canônica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de fallback, pins de perfil de autenticação e pins do harness Codex persistidos na sessão são reparados em todos os armazenamentos descobertos de sessões de agente.
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex a partir do chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador ACP/acpx externo."

  </Accordion>
  <Accordion title="2g. Limpeza de rota de sessão">
    O Doctor também examina armazenamentos descobertos de sessões de agente em busca de estado de rota obsoleto criado automaticamente depois que você move modelos configurados ou runtime para fora de uma rota pertencente a Plugin, como Codex.

    `openclaw doctor --fix` pode limpar estado obsoleto criado automaticamente, como pins de modelo `modelOverrideSource: "auto"`, metadados de modelo de runtime, IDs de harness fixados, vinculações de sessão da CLI e substituições automáticas de perfil de autenticação quando a rota proprietária delas não está mais configurada. Escolhas explícitas do usuário ou de modelo de sessão legado são relatadas para revisão manual e deixadas intactas; altere-as com `/model ...`, `/new` ou redefina a sessão quando essa rota não for mais pretendida.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O Doctor pode migrar layouts antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID da conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando deixar pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente o diretório legado de sessões + agente na inicialização, para que histórico/autenticação/modelos cheguem ao caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização de provider/mapa de providers do Talk agora compara por igualdade estrutural, portanto diffs apenas de ordem de chaves não acionam mais mudanças repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifesto de Plugin legado">
    O Doctor examina todos os manifestos de Plugins instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Essa migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações de armazenamento Cron legado">
    O Doctor também verifica o armazenamento de jobs cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de jobs que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` de payload → `delivery.channel` explícito
    - sentinelas inválidas de cron persistidas em `payload.model` (`"default"`, `"null"`, strings em branco, JSON `null`) → substituição de modelo removida
    - jobs simples legados de fallback de webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O diagnóstico só migra automaticamente tarefas `notify: true` quando pode fazer isso sem alterar o comportamento. Se uma tarefa combina o fallback legado de notify com um modo de entrega que não é Webhook existente, o diagnóstico alerta e deixa essa tarefa para análise manual.

    No Linux, o diagnóstico também alerta quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local do host não é mantido pelo OpenClaw atual e pode gravar mensagens falsas `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o Cron não consegue acessar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para as verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueios de sessão">
    O diagnóstico examina todos os diretórios de sessão de agente em busca de arquivos obsoletos de bloqueio de gravação — arquivos deixados para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata: o caminho, o PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID encerrado ou mais antigo que 30 minutos). No modo `--fix` / `--repair`, ele remove automaticamente arquivos de bloqueio obsoletos; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    O diagnóstico examina arquivos JSONL de sessão de agente em busca do formato de ramificação duplicada criado pelo bug de reescrita da transcrição de prompts de 2026.4.24: uma interação de usuário abandonada com contexto de execução interno do OpenClaw, além de uma ramificação irmã ativa contendo o mesmo prompt visível do usuário. No modo `--fix` / `--repair`, o diagnóstico cria uma cópia de segurança de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do Gateway e os leitores de memória não vejam mais interações duplicadas.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o centro operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha cópias de segurança em outro lugar).

    O diagnóstico verifica:

    - **Diretório de estado ausente**: alerta sobre perda catastrófica de estado, solicita a recriação do diretório e lembra que não pode recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica se ele é gravável; oferece reparar permissões (e emite uma dica de `chown` quando uma incompatibilidade de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado em nuvem no macOS**: alerta quando o estado resolve sob o iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos baseados em sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: alerta quando o estado resolve para uma origem de montagem `mmcblk*`, porque E/S aleatória baseada em SD ou eMMC pode ser mais lenta e desgastar mais rápido sob gravações de sessão e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: alerta quando entradas recentes de sessão têm arquivos de transcrição ausentes.
    - **JSONL de 1 linha da sessão principal**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está se acumulando).
    - **Múltiplos diretórios de estado**: alerta quando múltiplas pastas `~/.openclaw` existem em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o diagnóstico lembra você de executá-lo no host remoto (o estado vive lá).
    - **Permissões do arquivo de configuração**: alerta se `~/.openclaw/openclaw.json` é legível por grupo ou por qualquer usuário e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade da autenticação de modelos (expiração de OAuth)">
    O diagnóstico inspeciona perfis OAuth no armazenamento de autenticação, alerta quando tokens estão expirando/expirados e pode renová-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de setup-token da Anthropic. Solicitações de renovação só aparecem ao executar interativamente (TTY); `--non-interactive` pula tentativas de renovação.

    Quando uma renovação OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para você entrar novamente), o diagnóstico relata que reautenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a executar.

    O diagnóstico também relata perfis de autenticação temporariamente inutilizáveis devido a:

    - períodos curtos de espera (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação do modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o diagnóstico valida a referência de modelo em relação ao catálogo e à lista de permissões e alerta quando ela não puder ser resolvida ou estiver proibida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandbox está habilitado, o diagnóstico verifica imagens Docker e oferece criar ou alternar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza da instalação de Plugin">
    O diagnóstico remove o estado legado de preparo de dependências de Plugin gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes de dependências geradas obsoletas, diretórios antigos de estágio de instalação, resíduos locais ao pacote de código anterior de reparo de dependências de plugins empacotados e cópias npm gerenciadas órfãs ou recuperadas de plugins `@openclaw/*` empacotados que podem ocultar o manifesto empacotado atual.

    O diagnóstico também pode reinstalar plugins baixáveis ausentes quando a configuração os referencia, mas o registro local de plugins não consegue encontrá-los. Exemplos incluem `plugins.entries` relevantes, configurações de canal/provedor/busca configuradas e ambientes de execução de agente configurados. Durante atualizações de pacote, o diagnóstico evita executar reparo de Plugin por gerenciador de pacotes enquanto o pacote central está sendo trocado; execute `openclaw doctor --fix` novamente após a atualização se um Plugin configurado ainda precisar de recuperação. A inicialização do Gateway e o recarregamento da configuração não executam gerenciadores de pacotes; instalações de plugins continuam sendo trabalho explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O diagnóstico detecta serviços de Gateway legados (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenClaw usando a porta atual do Gateway. Ele também pode examinar serviços extras semelhantes ao Gateway e imprimir dicas de limpeza. Serviços de Gateway OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras."

    No Linux, se o serviço de Gateway em nível de usuário estiver ausente, mas existir um serviço de Gateway OpenClaw em nível de sistema, o diagnóstico não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`; depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor de sistema controlar o ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o diagnóstico (no modo `--fix` / `--repair`) cria um snapshot pré-migração e depois executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas são não fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é ignorada inteiramente.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivos e desvio de autenticação">
    O diagnóstico agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de integridade.

    O que ele relata:

    - solicitações pendentes de primeiro pareamento
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos desviam para fora da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual que são anteriores a uma rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

    O diagnóstico não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecionar solicitações pendentes com `openclaw devices list`
    - aprovar a solicitação exata com `openclaw devices approve <requestId>`
    - rotacionar um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remover e reaprovar um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pareamento obrigatório": o diagnóstico agora distingue o primeiro pareamento de upgrades pendentes de função/escopo e de desvios obsoletos de token/identidade de dispositivo.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O diagnóstico emite avisos quando um provedor está aberto a DMs sem uma lista de permissões ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. linger do systemd (Linux)">
    Se estiver sendo executado como um serviço de usuário systemd, o diagnóstico garante que o linger esteja habilitado para que o Gateway permaneça ativo após o encerramento da sessão.
  </Accordion>
  <Accordion title="11. Status do espaço de trabalho (Skills, plugins e diretórios legados)">
    O diagnóstico imprime um resumo do estado do espaço de trabalho para o agente padrão:

    - **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por lista de permissões.
    - **Diretórios legados do espaço de trabalho**: alerta quando `~/openclaw` ou outros diretórios legados de espaço de trabalho existem ao lado do espaço de trabalho atual.
    - **Status de Plugin**: conta plugins habilitados/desabilitados/com erro; lista IDs de plugins para quaisquer erros; relata capacidades de plugins do pacote.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins que têm problemas de compatibilidade com o ambiente de execução atual.
    - **Diagnóstico de Plugin**: expõe quaisquer avisos ou erros em tempo de carregamento emitidos pelo registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O diagnóstico verifica se os arquivos de bootstrap do espaço de trabalho (por exemplo, `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele relata, por arquivo, contagens de caracteres brutos vs. injetados, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e caracteres injetados totais como uma fração do orçamento total. Quando arquivos são truncados ou estão próximos do limite, o diagnóstico imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de Plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um Plugin de canal ausente, ele também remove a configuração órfã no escopo do canal que referenciava esse Plugin: entradas `channels.<id>`, destinos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o ambiente de execução do canal não existe mais, mas a configuração ainda pede que o Gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Compleção de shell">
    O diagnóstico verifica se a compleção por Tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão lento de compleção dinâmica (`source <(openclaw completion ...)`), o diagnóstico o atualiza para a variante mais rápida com arquivo em cache.
    - Se a compleção estiver configurada no perfil, mas o arquivo de cache estiver ausente, o diagnóstico regenera o cache automaticamente.
    - Se nenhuma compleção estiver configurada, o diagnóstico solicita instalá-la (somente em modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O diagnóstico verifica a prontidão da autenticação por token local do Gateway.

    - Se o modo de token precisa de um token e nenhuma origem de token existe, o diagnóstico oferece gerar um.
    - Se `gateway.auth.token` é gerenciado por SecretRef, mas está indisponível, o diagnóstico alerta e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum token SecretRef está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida em runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família de status para reparos de configuração direcionados.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar as credenciais configuradas do bot quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor informa que a credencial está configurada, mas indisponível, e pula a resolução automática em vez de travar ou informar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinicialização">
    O doctor executa uma verificação de integridade e oferece reiniciar o Gateway quando ele parece não estar saudável.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O doctor verifica se o provedor de embeddings de busca de memória configurado está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: sonda se o binário `qmd` está disponível e pode ser iniciado. Se não estiver, imprime orientações de correção, incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL de modelo remoto/baixável reconhecida. Se estiver ausente, sugere alternar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se uma chave de API está presente no ambiente ou no repositório de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado em cache da sondagem do Gateway está disponível (o Gateway estava saudável no momento da verificação), o doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status de memória profundo quando quiser uma verificação em tempo real do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em runtime.

  </Accordion>
  <Accordion title="14. Avisos de status de canal">
    Se o Gateway estiver saudável, o doctor executa uma sondagem de status de canal e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração do supervisor instalada (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e atraso de reinicialização). Quando encontra uma incompatibilidade, recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita as solicitações de reparo padrão.
    - `openclaw doctor --repair` aplica as correções recomendadas sem solicitações.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço do Gateway. Ele ainda relata a integridade do serviço e executa reparos não relacionados ao serviço, mas pula instalação/inicialização/reinicialização/bootstrap do serviço, reescritas de configuração do supervisor e limpeza de serviços legados porque um supervisor externo é responsável por esse ciclo de vida.
    - No Linux, o doctor não reescreve metadados de comando/entrypoint enquanto a unidade systemd correspondente do Gateway está ativa. Ele também ignora unidades extras inativas não legadas semelhantes ao Gateway durante a varredura de serviços duplicados, para que arquivos de serviço complementares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores de token em texto puro resolvidos nos metadados de ambiente do serviço do supervisor.
    - O doctor detecta valores de ambiente de serviço gerenciados por `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Tarefas Agendadas do Windows incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da fonte de runtime em vez da definição do supervisor.
    - O doctor detecta quando o comando do serviço ainda fixa um `--port` antigo após alterações em `gateway.port` e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef do token configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
    - Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd do Linux, as verificações de divergência de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Os reparos de serviço do doctor recusam reescrever, parar ou reiniciar um serviço do Gateway a partir de um binário antigo do OpenClaw quando a configuração foi escrita pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime do Gateway + diagnósticos de porta">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do Gateway (padrão `18789`) e relata causas prováveis (Gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Práticas recomendadas de runtime do Gateway">
    O doctor avisa quando o serviço do Gateway é executado no Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH canônico do sistema (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, para que Volta, asdf, fnm, pnpm e outros diretórios de gerenciadores de versão não alterem qual Node os processos filhos resolvem. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios de fallback inferidos de gerenciadores de versão só são escritos no PATH do serviço quando esses diretórios existem em disco.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O doctor persiste quaisquer alterações de configuração e marca os metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre estrutura de workspace e backup com git (GitHub ou GitLab privado recomendado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
