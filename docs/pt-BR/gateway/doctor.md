---
read_when:
    - Adição ou modificação de migrações de diagnóstico
    - Introduzindo alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-05T01:46:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige configuração/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

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

    Também aplica reparos agressivos (sobrescreve configurações personalizadas do supervisor).

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

    Verifica serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se você quiser revisar as alterações antes de gravar, abra o arquivo de configuração primeiro:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, interface e atualizações">
    - Atualização opcional de pré-verificação para instalações via git (somente interativo).
    - Verificação de atualização do protocolo da interface (recompila a Interface de Controle quando o esquema do protocolo é mais recente).
    - Verificação de integridade + prompt de reinicialização.
    - Resumo de status de Skills (qualificadas/ausentes/bloqueadas) e status de plugins.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração de Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do MCP do Chrome.
    - Avisos de sobrescrita do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis de OAuth do OpenAI Codex.
    - Avisos de lista de permissões de Plugin/ferramenta quando `plugins.allow` é restritiva, mas a política de ferramentas ainda solicita curingas ou ferramentas pertencentes a plugins.
    - Migração de estado legado em disco (sessões/diretório de agentes/autenticação do WhatsApp).
    - Migração de chaves legadas de contrato do manifesto do plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração do armazenamento legado de Cron (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, payload `provider`, jobs fallback simples de Webhook `notify: true`).
    - Migração legada da política de runtime do agente para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Limpeza de configurações obsoletas de plugins quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas de plugins são tratadas como configuração inerte de contenção e são preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcrições de sessão para branches duplicados de reescrita de prompt criados por builds 2026.4.24 afetados.
    - Detecção de tombstone de recuperação por reinicialização de subagente travado, com suporte a `--fix` para limpar flags obsoletos de recuperação abortada, para que a inicialização não continue tratando o filho como abortado por reinicialização.
    - Verificações de integridade de estado e permissões (sessões, transcrições, diretório de estado).
    - Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação do modelo: verifica expiração do OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desabilitado de perfis de autenticação.
    - Detecção de diretório extra de workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando o sandboxing está habilitado.
    - Migração de serviço legado e detecção de Gateways extras.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (sondados a partir do Gateway em execução).
    - Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza do ambiente de proxy embutido para serviços do Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante instalação ou atualização.
    - Verificações de boas práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciadores de versão).
    - Diagnósticos de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas de DM aberto.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando nenhuma fonte de token existe; não sobrescreve configurações de SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, desvio de cache obsoleto de token de dispositivo local e desvio de autenticação de registros pareados).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo ao limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; relata Skills permitidas com bins, env, config ou requisitos de SO ausentes, e `--fix` pode desabilitar Skills indisponíveis em `skills.entries`.
    - Verificação de status de completação do shell e instalação/upgrade automáticos.
    - Verificação de prontidão do provedor de embeddings da busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Backfill e redefinição da interface Dreams

A cena Dreams da Interface de Controle inclui as ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de trabalho de Dreaming fundamentado. Essas ações usam métodos RPC no estilo do doctor do Gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** verifica arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem do diário REM fundamentado e grava entradas reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas marcadas de diário de backfill de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas de curto prazo preparadas e somente fundamentadas que vieram de replay histórico e ainda não acumularam recall ao vivo ou suporte diário.

O que elas **não** fazem por si só:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não preparam automaticamente candidatos fundamentados no armazenamento de promoção de curto prazo ao vivo, a menos que você execute explicitamente o caminho preparado da CLI primeiro

Se você quiser que o replay histórico fundamentado influencie a trilha normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso prepara candidatos duráveis fundamentados no armazenamento de Dreaming de curto prazo, mantendo `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se este for um checkout do git e o doctor estiver em execução interativa, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valores legados (por exemplo, `messages.ackReaction` sem uma sobrescrita específica de canal), o doctor os normaliza para o esquema atual.

    Isso inclui campos planos legados de Talk. A configuração pública atual de Talk é `talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` no mapa de provedores.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas de ferramenta curingas ou pertencentes a plugins. `tools.allow: ["*"]` corresponde apenas a ferramentas
    de plugins que realmente carregam; ele não contorna a lista exclusiva de permissões de plugins.
    O doctor grava `plugins.bundledDiscovery: "compat"` para configurações legadas migradas
    de lista de permissões para preservar o comportamento existente de provedores empacotados e
    então aponta para a configuração mais rígida `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

    O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um formato de configuração legado, então configurações obsoletas são reparadas sem intervenção manual. Migrações do armazenamento de jobs de Cron são tratadas por `openclaw doctor --fix`.

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
    - legado `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Para canais com `accounts` nomeadas, mas com valores de canal de nível superior de conta única ainda remanescentes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para tempos limite lentos de provedor/modelo
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de retransmissão da extensão)
    - legado `models.providers.*.api: "openai"` → `"openai-completions"` (a inicialização do gateway também ignora provedores cujo `api` está definido como um valor de enum futuro ou desconhecido, em vez de falhar de forma fechada)

    Os avisos do Doctor também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O Doctor avisa para que você possa remover a substituição e restaurar o roteamento de API por modelo + custos.
  </Accordion>
  <Accordion title="2c. Migração de navegador e prontidão do Chrome MCP">
    Se a configuração do seu navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de anexação Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O Doctor também audita o caminho Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela é inferior ao Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O Doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/node
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui se refere apenas aos pré-requisitos de anexação local. Existing-session mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Eles continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS para OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint de autorização da OpenAI para verificar se a pilha TLS local de Node/OpenSSL consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientações de correção específicas da plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo se o gateway estiver saudável.
  </Accordion>
  <Accordion title="2e. Substituições de provedor OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte OpenAI em `models.providers.openai-codex`, elas podem mascarar o caminho do provedor OAuth do Codex integrado que versões mais recentes usam automaticamente. O Doctor avisa quando detecta essas configurações antigas de transporte junto com Codex OAuth, para que você possa remover ou reescrever a substituição de transporte obsoleta e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições somente de cabeçalhos ainda são compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Avisos de rota do Plugin Codex">
    Quando o Plugin Codex incluído está habilitado, o doctor também verifica se refs de modelo primário `openai-codex/*` ainda resolvem pelo executor PI padrão. Essa combinação é válida quando você quer autenticação OAuth/assinatura do Codex por meio do PI, mas é fácil confundi-la com o harness nativo do servidor de aplicativo do Codex. O Doctor avisa e aponta para o formato explícito do servidor de aplicativo: `openai/*` mais `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    O Doctor não repara isso automaticamente porque ambas as rotas são válidas:

    - `openai-codex/*` + PI significa "usar autenticação OAuth/assinatura do Codex por meio do executor normal do OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "executar o turno incorporado por meio do servidor de aplicativo nativo do Codex."
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex a partir do chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx."

    Se o aviso aparecer, escolha a rota pretendida e edite a configuração manualmente. Mantenha o aviso como está quando o PI Codex OAuth for intencional.

  </Accordion>
  <Accordion title="2g. Limpeza de rota de sessão">
    O Doctor também verifica o armazenamento de sessões ativas em busca de estado de rota obsoleto criado automaticamente depois que você move o modelo ou runtime padrão/fallback configurado para longe de uma rota pertencente a um Plugin, como Codex.

    `openclaw doctor --fix` pode limpar estado obsoleto criado automaticamente, como pins de modelo `modelOverrideSource: "auto"`, metadados de modelo de runtime, IDs de harness fixados, vinculações de sessão da CLI e substituições automáticas de perfil de autenticação quando a rota proprietária deles não está mais configurada. Escolhas explícitas de usuário ou modelos de sessão legados são relatadas para revisão manual e deixadas intactas; troque-as com `/model ...`, `/new` ou redefina a sessão quando essa rota não for mais pretendida.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O Doctor pode migrar layouts em disco mais antigos para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID da conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando deixar quaisquer pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente o armazenamento de sessões legado + diretório do agente na inicialização, para que histórico/autenticação/modelos entrem no caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores de Talk agora compara por igualdade estrutural, portanto diferenças apenas na ordem das chaves não acionam mais alterações repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifesto de Plugin legado">
    O Doctor verifica todos os manifestos de Plugin instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Esta migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações de armazenamento Cron legado">
    O Doctor também verifica o armazenamento de jobs Cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de job que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` do payload → `delivery.channel` explícito
    - jobs simples legados de fallback de webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O Doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem alterar o comportamento. Se um job combinar fallback de notificação legado com um modo de entrega não webhook existente, o doctor avisa e deixa esse job para revisão manual.

    No Linux, o doctor também avisa quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local do host não é mantido pelo OpenClaw atual e pode gravar mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para as verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueio de sessão">
    O Doctor verifica todos os diretórios de sessão de agentes em busca de arquivos de bloqueio de escrita obsoletos — arquivos deixados para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de bloqueio encontrado, ele informa: o caminho, PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`, ele remove arquivos de bloqueio obsoletos automaticamente; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    O Doctor verifica arquivos JSONL de sessão de agentes em busca do formato de ramificação duplicada criado pelo bug de reescrita da transcrição de prompt de 2026.4.24: uma rodada abandonada do usuário com contexto de runtime interno do OpenClaw, além de uma ramificação irmã ativa contendo o mesmo prompt visível do usuário. No modo `--fix` / `--repair`, o doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do Gateway e os leitores de memória não vejam mais rodadas duplicadas.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O Doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não pode recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a possibilidade de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma divergência de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com nuvem no macOS**: avisa quando o estado resolve sob iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado resolve para uma origem de montagem `mmcblk*`, porque E/S aleatória baseada em SD ou eMMC pode ser mais lenta e desgastar mais rapidamente com escritas de sessões e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são obrigatórios para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: avisa quando entradas de sessão recentes têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está se acumulando).
    - **Múltiplos diretórios de estado**: avisa quando múltiplas pastas `~/.openclaw` existem entre diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode ser dividido entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` é legível por grupo/mundo e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade de autenticação de modelo (expiração do OAuth)">
    O Doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de token de configuração da Anthropic. Prompts de atualização aparecem apenas ao executar interativamente (TTY); `--non-interactive` ignora tentativas de atualização.

    Quando uma atualização OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor solicitando que você entre novamente), o doctor informa que uma nova autenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a ser executado.

    O Doctor também informa perfis de autenticação que estão temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de faturamento/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo contra o catálogo e a lista de permissões e avisa quando ela não resolve ou não é permitida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando sandboxing está habilitado, o doctor verifica imagens Docker e oferece criar ou trocar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugin">
    O Doctor remove o estado legado de preparação de dependências de Plugin gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes de dependências geradas obsoletas, diretórios antigos de estágio de instalação, resíduos locais de pacote de código anterior de reparo de dependências de plugins incluídos e cópias npm gerenciadas órfãs ou recuperadas de plugins `@openclaw/*` incluídos que podem sombrear o manifesto incluído atual.

    O Doctor também pode reinstalar plugins baixáveis ausentes quando a configuração os referencia, mas o registro local de plugins não consegue encontrá-los. Exemplos incluem `plugins.entries` materiais, configurações de canal/provedor/busca configuradas e runtimes de agentes configurados. Durante atualizações de pacote, o doctor evita executar reparo de plugins pelo gerenciador de pacotes enquanto o pacote principal está sendo trocado; execute `openclaw doctor --fix` novamente após a atualização se um Plugin configurado ainda precisar de recuperação. A inicialização do Gateway e a recarga de configuração não executam gerenciadores de pacotes; instalações de plugins continuam sendo trabalho explícito de doctor/instalação/atualização.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O Doctor detecta serviços de gateway legados (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenClaw usando a porta atual do Gateway. Ele também pode verificar serviços extras semelhantes a gateway e imprimir dicas de limpeza. Serviços de gateway OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras".

    No Linux, se o serviço de Gateway no nível do usuário estiver ausente, mas existir um serviço de Gateway OpenClaw no nível do sistema, o doctor não instala automaticamente um segundo serviço no nível do usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`; depois, remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor do sistema for responsável pelo ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração da Matrix na inicialização">
    Quando uma conta de canal Matrix tem uma migração de estado legada pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração de melhor esforço: migração de estado legada da Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), esta verificação é ignorada inteiramente.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivo e desvio de autenticação">
    O Doctor agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de integridade.

    O que ele informa:

    - solicitações pendentes de primeiro pareamento
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos se desviam da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual que antecedem uma rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

    O Doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e reprove um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo exigência de pareamento": o doctor agora diferencia o primeiro pareamento de upgrades pendentes de função/escopo e de desvios de token/identidade de dispositivo obsoletos.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O Doctor emite avisos quando um provedor está aberto a DMs sem uma lista de permissões ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se estiver executando como um serviço de usuário systemd, o doctor garante que o linger esteja habilitado para que o gateway permaneça ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do workspace (Skills, plugins e diretórios legados)">
    O Doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por lista de permissões.
    - **Diretórios legados de workspace**: avisa quando `~/openclaw` ou outros diretórios legados de workspace existem junto ao workspace atual.
    - **Status de Plugin**: conta plugins habilitados/desabilitados/com erro; lista IDs de Plugin para quaisquer erros; informa capacidades de plugins incluídos.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros de tempo de carregamento emitidos pelo registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O Doctor verifica se os arquivos de bootstrap do workspace (por exemplo `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele informa, por arquivo, contagens de caracteres brutos vs. injetados, percentual de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados como fração do orçamento total. Quando arquivos são truncados ou estão próximos do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de Plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um Plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse Plugin: entradas `channels.<id>`, destinos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal desapareceu, mas a configuração ainda pede que o gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Completação de shell">
    O Doctor verifica se a completação por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão lento de completação dinâmica (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida com arquivo em cache.
    - Se a completação está configurada no perfil, mas o arquivo de cache está ausente, o doctor regenera o cache automaticamente.
    - Se nenhuma completação estiver configurada, o doctor solicita instalá-la (somente modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O Doctor verifica a prontidão da autenticação por token do Gateway local.

    - Se o modo de token precisar de um token e não existir nenhuma fonte de token, o doctor oferece gerar um.
    - Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração apenas quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura que os comandos da família de status para reparos direcionados de configuração.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar as credenciais configuradas do bot quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor informa que a credencial está configurada, mas indisponível, e pula a resolução automática em vez de travar ou informar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinicialização">
    O doctor executa uma verificação de integridade e oferece reiniciar o Gateway quando ele parece não estar íntegro.
  </Accordion>
  <Accordion title="13b. Prontidão da pesquisa de memória">
    O doctor verifica se o provedor configurado de embeddings da pesquisa de memória está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL reconhecida de modelo remoto/baixável. Se estiver ausente, sugere mudar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se há uma chave de API presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sondagem do Gateway em cache está disponível (o Gateway estava íntegro no momento da verificação), o doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status profundo da memória quando quiser uma verificação ao vivo do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em runtime.

  </Accordion>
  <Accordion title="14. Avisos de status de canal">
    Se o Gateway estiver íntegro, o doctor executa uma sondagem de status de canal e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e atraso de reinício). Quando encontra uma divergência, ele recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita as solicitações de reparo padrão.
    - `openclaw doctor --repair` aplica as correções recomendadas sem solicitações.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço do Gateway. Ele ainda relata a integridade do serviço e executa reparos que não envolvem serviço, mas pula instalação/início/reinício/bootstrap de serviço, reescritas da configuração do supervisor e limpeza de serviços legados porque um supervisor externo controla esse ciclo de vida.
    - No Linux, o doctor não reescreve metadados de comando/ponto de entrada enquanto a unidade systemd correspondente do Gateway está ativa. Ele também ignora unidades extras inativas e não legadas semelhantes ao Gateway durante a varredura de serviços duplicados, para que arquivos de serviço complementares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores de token em texto claro resolvidos nos metadados de ambiente do serviço do supervisor.
    - O doctor detecta valores de ambiente de serviço gerenciados por `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Windows Scheduled Task incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da origem em runtime em vez da definição do supervisor.
    - O doctor detecta quando o comando do serviço ainda fixa um `--port` antigo após alterações em `gateway.port` e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd do Linux, as verificações de divergência de token do doctor agora incluem origens `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Os reparos de serviço do doctor se recusam a reescrever, parar ou reiniciar um serviço do Gateway a partir de um binário antigo do OpenClaw quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do Gateway (padrão `18789`) e relata causas prováveis (Gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Boas práticas de runtime do Gateway">
    O doctor avisa quando o serviço do Gateway é executado no Bun ou em um caminho do Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf` etc.). Os canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de sistema do Node quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH de sistema canônico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, portanto Volta, asdf, fnm, pnpm e outros diretórios de gerenciadores de versão não alteram qual Node é resolvido por processos filhos. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios de fallback inferidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem no disco.

  </Accordion>
  <Accordion title="18. Gravação da configuração + metadados do assistente">
    O doctor persiste quaisquer alterações de configuração e marca os metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para ver um guia completo sobre estrutura de workspace e backup com git (recomendado GitHub ou GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
