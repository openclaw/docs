---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando Doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-02T05:46:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff4ab00fd6a11588abe790350fe139bc49f61e688bcd741389dd63732aa4430c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige configuração/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Modos sem interface e de automação

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

    Examina serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se você quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização opcional antes da execução para instalações via git (somente interativo).
    - Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais novo).
    - Verificação de integridade + prompt de reinicialização.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de plugin.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração de Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração de navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de sobrescrita do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis de OAuth do OpenAI Codex.
    - Avisos de lista de permissões de plugin/ferramentas quando `plugins.allow` é restritivo, mas a política de ferramentas ainda pede curinga ou ferramentas pertencentes a plugins.
    - Migração de estado legado em disco (sessions/agent dir/autenticação do WhatsApp).
    - Migração de chaves legadas do contrato de manifesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração do armazenamento legado de Cron (`jobId`, `schedule.cron`, campos de delivery/payload de nível superior, payload `provider`, jobs simples de fallback de webhook `notify: true`).
    - Migração legada da política de runtime de agente para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Limpeza de configuração obsoleta de plugin quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas a plugins são tratadas como configuração inerte de contenção e preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivo de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcritos de sessão para branches duplicados de reescrita de prompt criados por builds 2026.4.24 afetados.
    - Detecção de tombstones de recuperação por reinicialização de subagentes travados, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada para que a inicialização não continue tratando o filho como abortado por reinicialização.
    - Verificações de integridade de estado e permissões (sessões, transcritos, diretório de estado).
    - Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação de modelos: verifica expiração do OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desabilitado de perfis de autenticação.
    - Detecção de diretório extra de workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando o sandboxing está habilitado.
    - Migração de serviço legado e detecção de Gateway extra.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (sondados a partir do Gateway em execução).
    - Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza do ambiente de proxy incorporado para serviços de Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de boas práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciadores de versão).
    - Diagnóstico de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas de DM abertas.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando nenhuma fonte de token existe; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, desvio obsoleto do cache local de token de dispositivo e desvio de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
    - Verificação de status de conclusão do shell e instalação/upgrade automáticos.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava a configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Backfill e redefinição da UI Dreams

A cena Dreams da Control UI inclui ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de trabalho de dreaming fundamentado. Essas ações usam métodos RPC no estilo doctor do Gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** examina arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem do diário REM fundamentado e grava entradas reversíveis de backfill em `DREAMS.md`.
- **Reset** remove de `DREAMS.md` apenas essas entradas marcadas de diário de backfill.
- **Clear Grounded** remove apenas entradas temporárias staged de curto prazo exclusivamente fundamentadas que vieram de replay histórico e ainda não acumularam recall em tempo real nem suporte diário.

O que elas **não** fazem por si só:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não colocam automaticamente candidatos fundamentados em staged no armazenamento ativo de promoção de curto prazo, a menos que você execute explicitamente primeiro o caminho staged da CLI

Se você quiser que o replay histórico fundamentado influencie a via normal de promoção profunda, use o fluxo da CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso coloca candidatos duráveis fundamentados em staged no armazenamento de dreaming de curto prazo, mantendo `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se este for um checkout git e o doctor estiver em execução interativa, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valor legados (por exemplo, `messages.ackReaction` sem uma sobrescrita específica de canal), o doctor os normaliza para o schema atual.

    Isso inclui campos planos legados de Talk. A configuração pública atual de Talk é `talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos de `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` no mapa de provedores.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas curingas ou de ferramentas pertencentes a plugins. `tools.allow: ["*"]` só corresponde a ferramentas
    de plugins que realmente carregam; ele não ignora a lista de permissões exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

    O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um formato de configuração legado, então configurações obsoletas são reparadas sem intervenção manual. Migrações do armazenamento de jobs Cron são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - Para canais com `accounts` nomeadas, mas com valores de canal de nível superior de conta única ainda restantes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para timeouts de provider/modelo lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de relay de extensão)
    - legado `models.providers.*.api: "openai"` → `"openai-completions"` (a inicialização do Gateway também ignora providers cujo `api` esteja definido como um valor de enum futuro ou desconhecido, em vez de falhar fechado)

    Os avisos do doctor também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Sobrescritas de provider do OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso sobrescreve o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você possa remover a sobrescrita e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração de navegador e prontidão do Chrome MCP">
    Se a sua configuração de navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de anexação do Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` vira `"existing-session"`
    - `browser.relayBindHost` é removido

    O doctor também audita o caminho do Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis de conexão automática padrão
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O doctor não pode habilitar a configuração no lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/node
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui trata apenas dos pré-requisitos de anexação local. Existing-session mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Eles continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor consulta o endpoint de autorização da OpenAI para verificar se a pilha TLS local de Node/OpenSSL consegue validar a cadeia de certificados. Se a consulta falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientação de correção específica por plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a consulta é executada mesmo que o gateway esteja saudável.
  </Accordion>
  <Accordion title="2e. Sobrescritas de provider OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte OpenAI em `models.providers.openai-codex`, elas podem encobrir o caminho integrado do provider OAuth do Codex que versões mais recentes usam automaticamente. O doctor avisa quando vê essas configurações antigas de transporte junto com OAuth do Codex, para que você possa remover ou reescrever a sobrescrita de transporte obsoleta e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e sobrescritas apenas de cabeçalho ainda são compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Avisos de rota do Plugin Codex">
    Quando o Plugin Codex incluído está habilitado, o doctor também verifica se referências de modelo primário `openai-codex/*` ainda resolvem pelo executor PI padrão. Essa combinação é válida quando você quer autenticação OAuth/assinatura do Codex via PI, mas é fácil confundi-la com o harness nativo de app-server do Codex. O doctor avisa e aponta para o formato explícito de app-server: `openai/*` mais `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    O doctor não repara isso automaticamente porque ambas as rotas são válidas:

    - `openai-codex/*` + PI significa "usar autenticação OAuth/assinatura do Codex pelo executor normal do OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "executar o turno embutido pelo app-server nativo do Codex."
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex pelo chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx."

    Se o aviso aparecer, escolha a rota que você pretendia e edite a configuração manualmente. Mantenha o aviso como está quando OAuth do PI Codex for intencional.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout de disco)">
    O doctor pode migrar layouts antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando deixar pastas legadas como backups. O Gateway/CLI também migra automaticamente o diretório legado de sessões + agente na inicialização, para que histórico/autenticação/modelos cheguem ao caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização de provider/mapa de providers de talk agora compara por igualdade estrutural, então diffs apenas de ordem de chaves não acionam mais alterações repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifestos legados de Plugin">
    O doctor examina todos os manifestos de Plugin instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontra, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Esta migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações de armazenamento cron legado">
    O doctor também verifica o armazenamento de jobs cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando sobrescrito) em busca de formatos antigos de jobs que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` no payload → `delivery.channel` explícito
    - jobs simples legados de fallback de webhook com `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O doctor só migra automaticamente jobs com `notify: true` quando consegue fazer isso sem alterar o comportamento. Se um job combina fallback legado de notificação com um modo de entrega existente que não seja webhook, o doctor avisa e deixa esse job para revisão manual.

    No Linux, o doctor também avisa quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local ao host não é mantido pelo OpenClaw atual e pode escrever mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para as verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueios de sessão">
    O Doctor verifica todos os diretórios de sessão de agentes em busca de arquivos de bloqueio de gravação obsoletos — arquivos deixados para trás quando uma sessão saiu de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata: o caminho, o PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`, ele remove automaticamente arquivos de bloqueio obsoletos; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    O Doctor verifica arquivos JSONL de sessão de agentes em busca do formato de ramificação duplicado criado pelo bug de reescrita de transcrição de prompt de 2026.4.24: um turno de usuário abandonado com contexto interno de runtime do OpenClaw mais um irmão ativo contendo o mesmo prompt de usuário visível. No modo `--fix` / `--repair`, o Doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do Gateway e os leitores de memória não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O Doctor verifica:

    - **Diretório de estado ausente**: alerta sobre perda catastrófica de estado, solicita a recriação do diretório e lembra que não pode recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica se é gravável; oferece reparar permissões (e emite uma dica de `chown` quando uma incompatibilidade de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com nuvem no macOS**: alerta quando o estado é resolvido em iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: alerta quando o estado é resolvido para uma origem de montagem `mmcblk*`, porque E/S aleatória apoiada por SD ou eMMC pode ser mais lenta e desgastar mais rapidamente sob gravações de sessão e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: alerta quando entradas recentes de sessão têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está se acumulando).
    - **Múltiplos diretórios de estado**: alerta quando existem várias pastas `~/.openclaw` em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o Doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: alerta se `~/.openclaw/openclaw.json` é legível por grupo/todos e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Saúde de autenticação de modelos (expiração de OAuth)">
    O Doctor inspeciona perfis OAuth no armazenamento de autenticação, alerta quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de token de configuração da Anthropic. Solicitações de atualização só aparecem ao executar interativamente (TTY); `--non-interactive` ignora tentativas de atualização.

    Quando uma atualização OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor informando que você precisa entrar novamente), o Doctor relata que a reautenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a executar.

    O Doctor também relata perfis de autenticação temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o Doctor valida a referência do modelo contra o catálogo e a allowlist e alerta quando ela não for resolvida ou for proibida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandbox está habilitado, o Doctor verifica imagens Docker e oferece criar ou alternar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugin">
    O Doctor remove estado legado de preparação de dependências de plugins geradas pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes obsoletas de dependências geradas, diretórios antigos de estágio de instalação e resíduos locais de pacote de código anterior de reparo de dependências de plugins integrados.

    O Doctor também pode reinstalar plugins baixáveis configurados quando a configuração os referencia, mas o registro local de plugins não consegue encontrá-los. A inicialização do Gateway e o recarregamento de configuração não executam gerenciadores de pacotes; instalações de plugins continuam sendo trabalho explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O Doctor detecta serviços legados do Gateway (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenClaw usando a porta atual do Gateway. Ele também pode verificar serviços extras semelhantes ao Gateway e imprimir dicas de limpeza. Serviços do Gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras."

    No Linux, se o serviço de Gateway em nível de usuário estiver ausente, mas existir um serviço de Gateway do OpenClaw em nível de sistema, o Doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep` e então remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor de sistema controlar o ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o Doctor (no modo `--fix` / `--repair`) cria uma captura pré-migração e então executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é totalmente ignorada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivo e desvio de autenticação">
    O Doctor agora inspeciona o estado de pareamento de dispositivos como parte da verificação normal de saúde.

    O que ele relata:

    - solicitações pendentes de pareamento inicial
    - atualizações pendentes de função para dispositivos já pareados
    - atualizações pendentes de escopo para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos se desviam da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual que são anteriores a uma rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

    O Doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e aprove novamente um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo exigência de pareamento": o Doctor agora distingue o pareamento inicial de atualizações pendentes de função/escopo e de desvios obsoletos de token/identidade de dispositivo.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O Doctor emite avisos quando um provedor está aberto a DMs sem uma allowlist, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se estiver executando como um serviço de usuário do systemd, o Doctor garante que linger esteja habilitado para que o Gateway permaneça ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do espaço de trabalho (skills, plugins e diretórios legados)">
    O Doctor imprime um resumo do estado do espaço de trabalho para o agente padrão:

    - **Status das Skills**: conta skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
    - **Diretórios de espaço de trabalho legados**: alerta quando `~/openclaw` ou outros diretórios de espaço de trabalho legados existem junto ao espaço de trabalho atual.
    - **Status de Plugin**: conta plugins habilitados/desabilitados/com erro; lista IDs de plugins para quaisquer erros; relata capacidades de plugins de bundle.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros de tempo de carregamento emitidos pelo registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O Doctor verifica se arquivos de bootstrap do espaço de trabalho (por exemplo, `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele relata, por arquivo, contagens de caracteres brutos vs. injetados, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados como fração do orçamento total. Quando arquivos são truncados ou se aproximam do limite, o Doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse plugin: entradas `channels.<id>`, destinos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal desapareceu, mas a configuração ainda pede que o Gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Completação de shell">
    O Doctor verifica se a completação por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil de shell usa um padrão lento de completação dinâmica (`source <(openclaw completion ...)`), o Doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se a completação está configurada no perfil, mas o arquivo de cache está ausente, o Doctor regenera o cache automaticamente.
    - Se nenhuma completação está configurada, o Doctor solicita instalá-la (somente modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O Doctor verifica a prontidão da autenticação por token do Gateway local.

    - Se o modo de token precisa de um token e não existe fonte de token, o Doctor oferece gerar um.
    - Se `gateway.auth.token` é gerenciado por SecretRef, mas está indisponível, o Doctor alerta e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo somente leitura de SecretRef que comandos da família de status para reparos de configuração direcionados.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais de bot configuradas quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o Doctor relata que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de travar ou relatar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de saúde do Gateway + reinício">
    O Doctor executa uma verificação de saúde e oferece reiniciar o Gateway quando ele parece não saudável.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O Doctor verifica se o provedor de embeddings de busca de memória configurado está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL reconhecida de modelo remoto/baixável. Se estiver ausente, sugere alternar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e, em seguida, tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sondagem do Gateway em cache está disponível (o Gateway estava íntegro no momento da verificação), o doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O doctor não inicia um novo ping de embeddings no caminho padrão; use o comando de status de memória profunda quando quiser uma verificação de provedor ao vivo.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em tempo de execução.

  </Accordion>
  <Accordion title="14. Avisos de status do canal">
    Se o Gateway estiver íntegro, o doctor executa uma sondagem de status do canal e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências systemd network-online e atraso de reinicialização). Quando encontra uma incompatibilidade, recomenda uma atualização e pode regravar o arquivo de serviço/tarefa com os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de regravar a configuração do supervisor.
    - `openclaw doctor --yes` aceita os prompts de reparo padrão.
    - `openclaw doctor --repair` aplica as correções recomendadas sem prompts.
    - `openclaw doctor --repair --force` substitui configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço do Gateway. Ele ainda relata a integridade do serviço e executa reparos que não são de serviço, mas ignora instalação/início/reinício/bootstrap do serviço, regravações da configuração do supervisor e limpeza de serviços legados porque um supervisor externo é responsável por esse ciclo de vida.
    - No Linux, o doctor não regrava metadados de comando/entrypoint enquanto a unidade systemd correspondente do Gateway está ativa. Ele também ignora unidades extras inativas não legadas semelhantes ao Gateway durante a verificação de serviços duplicados, para que arquivos de serviço acompanhantes não criem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
    - O doctor detecta valores de ambiente de serviço gerenciados por `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Tarefas Agendadas do Windows incorporaram inline e regrava os metadados do serviço para que esses valores sejam carregados da origem de runtime em vez da definição do supervisor.
    - O doctor detecta quando o comando do serviço ainda fixa uma `--port` antiga após alterações em `gateway.port` e regrava os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd no Linux, as verificações de desvio de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Os reparos de serviço do doctor se recusam a regravar, parar ou reiniciar um serviço do Gateway de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais recente. Consulte [solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma regravação completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do Gateway (padrão `18789`) e relata causas prováveis (Gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Práticas recomendadas de runtime do Gateway">
    O doctor avisa quando o serviço do Gateway é executado no Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    Serviços recém-instalados ou reparados mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios fallback inferidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem em disco. Isso mantém o PATH do supervisor gerado alinhado com a mesma auditoria de PATH mínimo que o doctor executa posteriormente.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O doctor persiste quaisquer alterações de configuração e carimba metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para ver um guia completo sobre estrutura de workspace e backup com git (recomendado GitHub ou GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
