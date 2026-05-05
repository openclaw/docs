---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introdução de alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-05T08:25:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
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

    Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinício/serviço/sandbox que exigem confirmação humana. Migrações de estado legadas são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Verifica serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as alterações antes de gravar, abra o arquivo de configuração primeiro:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização prévia opcional para instalações via git (somente interativo).
    - Verificação de atualização do protocolo da UI (recria a UI de Controle quando o esquema do protocolo é mais recente).
    - Verificação de integridade + prompt de reinício.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração de Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração de navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento de OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis OpenAI Codex OAuth.
    - Avisos de lista de permissões de plugins/ferramentas quando `plugins.allow` é restritivo, mas a política de ferramentas ainda solicita curinga ou ferramentas pertencentes a plugins.
    - Migração de estado legado em disco (sessions/diretório do agente/autenticação do WhatsApp).
    - Migração de chave legada do contrato de manifesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração de armazenamento Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, payload `provider`, jobs de fallback de Webhook simples `notify: true`).
    - Migração legada da política de runtime do agente para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Limpeza de configuração de plugin obsoleta quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas a plugins são tratadas como configuração de contenção inerte e preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção do arquivo de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcrições de sessão para ramificações duplicadas de reescrita de prompt criadas por builds afetados de 2026.4.24.
    - Detecção de tombstone de recuperação por reinício de subagentes travados, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada para que a inicialização não continue tratando o filho como abortado por reinício.
    - Verificações de integridade de estado e permissões (sessões, transcrições, diretório de estado).
    - Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade da autenticação de modelo: verifica expiração do OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desabilitado de auth-profile.
    - Detecção de diretório de workspace extra (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando o sandboxing está habilitado.
    - Migração de serviço legado e detecção extra de Gateway.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (consultados a partir do Gateway em execução).
    - Verificações de responsividade do WhatsApp para integridade degradada do loop de eventos do Gateway com clientes TUI locais ainda em execução; `--fix` interrompe apenas clientes TUI locais verificados.
    - Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza do ambiente de proxy embutido para serviços do Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de boas práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciador de versão).
    - Diagnósticos de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas de DM abertas.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe origem de token; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de papel/escopo, divergência de cache de token de dispositivo local obsoleto e divergência de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; relata Skills permitidas com binários, env, config ou requisitos de SO ausentes, e `--fix` pode desabilitar Skills indisponíveis em `skills.entries`.
    - Verificação de status de conclusão de shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embeddings da busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets da UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Backfill e redefinição da UI Dreams

A cena Dreams da UI de Controle inclui ações **Backfill**, **Redefinir** e **Limpar Fundamentado** para o fluxo de trabalho de Dreaming fundamentado. Essas ações usam métodos RPC no estilo doctor do Gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** verifica arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM fundamentado e grava entradas reversíveis de backfill em `DREAMS.md`.
- **Redefinir** remove apenas essas entradas marcadas de diário de backfill de `DREAMS.md`.
- **Limpar Fundamentado** remove apenas entradas de curto prazo somente fundamentadas em stage que vieram de repetição histórica e ainda não acumularam recall ao vivo nem suporte diário.

O que elas **não** fazem por si só:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não colocam automaticamente candidatos fundamentados em stage no armazenamento de promoção de curto prazo ao vivo, a menos que você execute explicitamente o caminho da CLI em stage primeiro

Se quiser que a repetição histórica fundamentada influencie a faixa normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso coloca candidatos duráveis fundamentados em stage no armazenamento de Dreaming de curto prazo, mantendo `DREAMS.md` como superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se este for um checkout git e o doctor estiver sendo executado interativamente, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valores legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o esquema atual.

    Isso inclui campos planos legados de Talk. A configuração pública atual de Talk é `talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` para o mapa de provedores.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas de ferramentas curinga ou pertencentes a plugins. `tools.allow: ["*"]` corresponde apenas a ferramentas
    de plugins que realmente carregam; ele não ignora a lista de permissões exclusiva de plugins.
    O doctor grava `plugins.bundledDiscovery: "compat"` para configurações legadas migradas
    de lista de permissões para preservar o comportamento existente de provedores empacotados, e
    então aponta para a configuração mais estrita `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor vai:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

    O Gateway também executa automaticamente as migrações do doctor na inicialização quando detecta um formato de configuração legado, então configurações obsoletas são reparadas sem intervenção manual. Migrações do armazenamento de jobs Cron são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurações de canais configurados sem política de respostas visíveis → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nível superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legados → `talk.provider` + `talk.providers.<provider>`
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
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para tempos limite de provedores/modelos lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de retransmissão da extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do Gateway também ignora provedores cujo `api` está definido como um valor de enum futuro ou desconhecido, em vez de falhar em modo fechado)

    Os avisos do doctor também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de reserva pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provedores OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos a usar a API errada ou zerar custos. O doctor avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração de navegador e prontidão do Chrome MCP">
    Se sua configuração de navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de anexação do Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O doctor também audita o caminho do Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de ativar a depuração remota na página de inspeção do navegador (por exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O doctor não consegue ativar a configuração no lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do Gateway/Node
    - o navegador em execução localmente
    - depuração remota ativada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui trata apenas dos pré-requisitos de anexação local. O modo existing-session mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de downloads e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos sem interface gráfica. Esses continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o ponto de extremidade de autorização da OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientações de correção específicas da plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo que o Gateway esteja íntegro.
  </Accordion>
  <Accordion title="2e. Substituições de provedor Codex OAuth">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem sobrepor o caminho integrado do provedor Codex OAuth que versões mais novas usam automaticamente. O doctor avisa quando vê essas configurações antigas de transporte junto com Codex OAuth, para que você possa remover ou reescrever a substituição de transporte obsoleta e recuperar o comportamento integrado de roteamento/reserva. Proxies personalizados e substituições somente de cabeçalhos ainda são compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Avisos de rota do plugin Codex">
    Quando o plugin Codex incluído está ativado, o doctor também verifica se referências de modelo primário `openai-codex/*` ainda são resolvidas pelo executor PI padrão. Essa combinação é válida quando você quer autenticação OAuth/assinatura do Codex por meio do PI, mas é fácil confundi-la com o ambiente de app-server nativo do Codex. O doctor avisa e aponta para o formato explícito de app-server: `openai/*` mais `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    O doctor não repara isso automaticamente porque ambas as rotas são válidas:

    - `openai-codex/*` + PI significa "usar autenticação OAuth/assinatura do Codex por meio do executor normal do OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "executar o turno incorporado pelo app-server nativo do Codex."
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex a partir do bate-papo."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador ACP/acpx externo."

    Se o aviso aparecer, escolha a rota pretendida e edite a configuração manualmente. Mantenha o aviso como está quando o Codex OAuth via PI for intencional.

  </Accordion>
  <Accordion title="2g. Limpeza de rotas de sessão">
    O doctor também verifica o armazenamento de sessões ativas em busca de estado de rota obsoleto criado automaticamente depois que você move o modelo ou tempo de execução padrão/de reserva configurado para longe de uma rota pertencente a um plugin, como Codex.

    `openclaw doctor --fix` pode limpar estados obsoletos criados automaticamente, como fixações de modelo `modelOverrideSource: "auto"`, metadados de modelo em tempo de execução, IDs de ambiente de execução fixados, vinculações de sessão da CLI e substituições automáticas de perfil de autenticação quando a rota proprietária deles não está mais configurada. Escolhas explícitas de modelo de usuário ou de sessão legada são relatadas para revisão manual e deixadas intocadas; alterne-as com `/model ...`, `/new` ou redefina a sessão quando essa rota não for mais desejada.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O doctor pode migrar layouts mais antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID da conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando deixar pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente as sessões legadas + o diretório do agente na inicialização, para que histórico/autenticação/modelos fiquem no caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é migrada intencionalmente apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores do Talk agora compara por igualdade estrutural, então diferenças apenas na ordem das chaves não acionam mais alterações repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifestos de plugin legados">
    O doctor verifica todos os manifestos de plugin instalados em busca de chaves de capacidade obsoletas de nível superior (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Esta migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações de armazenamento Cron legado">
    O doctor também verifica o armazenamento de tarefas Cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de tarefa que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de Cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de carga útil de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - apelidos de entrega de `provider` da carga útil → `delivery.channel` explícito
    - tarefas legadas simples de reserva de Webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O doctor só migra automaticamente tarefas `notify: true` quando consegue fazer isso sem alterar o comportamento. Se uma tarefa combina reserva de notificação legada com um modo de entrega não Webhook existente, o doctor avisa e deixa essa tarefa para revisão manual.

    No Linux, doctor também avisa quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local do host não é mantido pelo OpenClaw atual e pode gravar mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para as verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueios de sessão">
    Doctor examina todos os diretórios de sessão de agente em busca de arquivos de bloqueio de escrita obsoletos — arquivos deixados para trás quando uma sessão terminou de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata: o caminho, PID, se o PID ainda está ativo, idade do bloqueio e se ele é considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`, ele remove arquivos de bloqueio obsoletos automaticamente; caso contrário, imprime uma nota e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    Doctor examina arquivos JSONL de sessões de agente em busca do formato de ramificação duplicado criado pelo bug de reescrita de transcrição de prompt de 2026.4.24: um turno de usuário abandonado com contexto interno de runtime do OpenClaw mais um irmão ativo contendo o mesmo prompt de usuário visível. No modo `--fix` / `--repair`, doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do Gateway e os leitores de memória não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    Doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não consegue recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a capacidade de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma divergência de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com nuvem no macOS**: avisa quando o estado resolve para dentro do iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com suporte de sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado resolve para uma origem de montagem `mmcblk*`, porque E/S aleatória com suporte em SD ou eMMC pode ser mais lenta e desgastar mais rapidamente sob gravações de sessões e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: avisa quando entradas recentes de sessão têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está acumulando).
    - **Múltiplos diretórios de estado**: avisa quando várias pastas `~/.openclaw` existem em diretórios pessoais ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, doctor lembra você de executá-lo no host remoto (o estado vive lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` é legível por grupo/todos e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade de autenticação de modelo (expiração de OAuth)">
    Doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de token de configuração da Anthropic. Prompts de atualização aparecem apenas durante execução interativa (TTY); `--non-interactive` ignora tentativas de atualização.

    Quando uma atualização OAuth falha permanentemente (por exemplo `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para você entrar novamente), doctor relata que a reautenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a ser executado.

    Doctor também relata perfis de autenticação temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, doctor valida a referência de modelo em relação ao catálogo e à lista de permissões e avisa quando ela não resolve ou é proibida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandboxing está ativado, doctor verifica imagens Docker e oferece compilar ou alternar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugin">
    Doctor remove o estado legado de preparação de dependências de Plugin gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes de dependência geradas obsoletas, diretórios antigos de estágio de instalação, resíduos locais de pacote de código anterior de reparo de dependências de Plugin empacotado e cópias npm gerenciadas órfãs ou recuperadas de plugins `@openclaw/*` empacotados que podem sombrear o manifesto empacotado atual.

    Doctor também pode reinstalar plugins baixáveis ausentes quando a configuração os referencia, mas o registro local de Plugin não consegue encontrá-los. Exemplos incluem `plugins.entries` materiais, configurações configuradas de canal/provedor/pesquisa e runtimes de agente configurados. Durante atualizações de pacote, doctor evita executar reparo de Plugin do gerenciador de pacotes enquanto o pacote principal está sendo trocado; execute `openclaw doctor --fix` novamente após a atualização se um Plugin configurado ainda precisar de recuperação. A inicialização do Gateway e o recarregamento de configuração não executam gerenciadores de pacotes; instalações de Plugin continuam sendo trabalho explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    Doctor detecta serviços legados de gateway (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenClaw usando a porta atual do gateway. Ele também pode procurar serviços adicionais semelhantes a gateway e imprimir dicas de limpeza. Serviços do gateway OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras."

    No Linux, se o serviço de gateway em nível de usuário estiver ausente, mas existir um serviço de gateway OpenClaw em nível de sistema, doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`, depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor de sistema controlar o ciclo de vida do gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas são não fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), esta verificação é ignorada inteiramente.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivo e divergência de autenticação">
    Doctor agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de integridade.

    O que ele relata:

    - solicitações de pareamento inicial pendentes
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de divergência de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos divergem da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual que antecedem uma rotação de token no lado do gateway ou carregam metadados de escopo obsoletos

    Doctor não aprova automaticamente solicitações de pareamento nem gira tokens de dispositivo automaticamente. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - gire um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e reaprove um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pareamento obrigatório": doctor agora distingue o pareamento inicial de upgrades pendentes de função/escopo e de divergência obsoleta de token/identidade de dispositivo.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    Doctor emite avisos quando um provedor está aberto a DMs sem uma lista de permissões, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se estiver em execução como um serviço de usuário do systemd, doctor garante que o lingering esteja ativado para que o gateway permaneça ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do workspace (Skills, plugins e diretórios legados)">
    Doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por lista de permissões.
    - **Diretórios legados de workspace**: avisa quando `~/openclaw` ou outros diretórios legados de workspace existem ao lado do workspace atual.
    - **Status de Plugin**: conta plugins ativados/desativados/com erro; lista IDs de Plugin para quaisquer erros; relata recursos de Plugin do pacote.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros de tempo de carregamento emitidos pelo registro de Plugin.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    Doctor verifica se arquivos de bootstrap do workspace (por exemplo `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão perto ou acima do orçamento de caracteres configurado. Ele relata contagens de caracteres brutas vs. injetadas por arquivo, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados como fração do orçamento total. Quando arquivos são truncados ou estão perto do limite, doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de Plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um Plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse Plugin: entradas `channels.<id>`, destinos de heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal desapareceu, mas a configuração ainda pede ao gateway para se vincular a ele.
  </Accordion>
  <Accordion title="11c. Compleção de shell">
    Doctor verifica se a compleção por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão lento de compleção dinâmica (`source <(openclaw completion ...)`), doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se a compleção está configurada no perfil, mas o arquivo de cache está ausente, doctor regenera o cache automaticamente.
    - Se nenhuma compleção está configurada, doctor solicita instalá-la (apenas modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    Doctor verifica a prontidão da autenticação por token local do gateway.

    - Se o modo de token precisa de um token e não existe fonte de token, doctor oferece gerar um.
    - Se `gateway.auth.token` é gerenciado por SecretRef, mas está indisponível, doctor avisa e não o sobrescreve com texto puro.
    - `openclaw doctor --generate-gateway-token` força a geração apenas quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família de status para reparos direcionados de configuração.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais de bot configuradas quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor informa que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de falhar ou informar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinicialização">
    O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece não estar íntegro.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O doctor verifica se o provedor de embeddings de busca de memória configurado está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientações de correção incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica um arquivo de modelo local ou uma URL reconhecida de modelo remoto/baixável. Se estiver ausente, sugere alternar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sondagem de gateway em cache está disponível (o gateway estava íntegro no momento da verificação), o doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status profundo de memória quando quiser uma verificação ao vivo do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em tempo de execução.

  </Accordion>
  <Accordion title="14. Avisos de status de canal">
    Se o gateway estiver íntegro, o doctor executa uma sondagem de status de canal e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências systemd network-online e atraso de reinício). Quando encontra uma divergência, recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita as solicitações de reparo padrão.
    - `openclaw doctor --repair` aplica correções recomendadas sem solicitações.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço do gateway. Ele ainda relata a integridade do serviço e executa reparos que não são de serviço, mas ignora instalação/início/reinício/bootstrap do serviço, reescritas de configuração do supervisor e limpeza de serviços legados porque um supervisor externo é dono desse ciclo de vida.
    - No Linux, o doctor não reescreve metadados de comando/ponto de entrada enquanto a unidade systemd correspondente do gateway está ativa. Ele também ignora unidades extras inativas semelhantes a gateway que não sejam legadas durante a varredura de serviços duplicados, para que arquivos de serviço complementares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço do supervisor.
    - O doctor detecta valores de ambiente de serviço gerenciados por `.env`/SecretRef que instalações mais antigas de LaunchAgent, systemd ou Windows Scheduled Task incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da fonte de runtime em vez da definição do supervisor.
    - O doctor detecta quando o comando do serviço ainda fixa uma `--port` antiga após alterações em `gateway.port` e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientação acionável.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd do Linux, as verificações de divergência de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Os reparos de serviço do doctor se recusam a reescrever, parar ou reiniciar um serviço de gateway a partir de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnóstico de runtime + porta do Gateway">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do gateway (padrão `18789`) e relata causas prováveis (gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Boas práticas de runtime do Gateway">
    O doctor avisa quando o serviço de gateway executa no Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Canais WhatsApp + Telegram exigem Node, e caminhos de gerenciador de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH canônico do sistema (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, para que Volta, asdf, fnm, pnpm e outros diretórios de gerenciador de versão não alterem qual Node os processos filhos resolvem. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios de fallback inferidos de gerenciador de versão só são gravados no PATH do serviço quando esses diretórios existem em disco.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O doctor persiste qualquer alteração de configuração e registra metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre estrutura de workspace e backup com git (GitHub ou GitLab privado recomendado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
