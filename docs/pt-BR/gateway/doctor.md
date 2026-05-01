---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introduzindo alterações incompatíveis de configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-01T05:56:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52183eaf6024eface20089f9d11143ef1e952d2488eee766dc154512f5d3c6b4
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige config/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

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

    Aplica também reparos agressivos (sobrescreve configs personalizadas de supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Executa sem prompts e aplica apenas migrações seguras (normalização de config + movimentações de estado no disco). Ignora ações de reinicialização/serviço/sandbox que exigem confirmação humana. Migrações de estado legado são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Varre serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se você quiser revisar as alterações antes de gravar, abra o arquivo de config primeiro:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Atualização opcional de pré-verificação para instalações git (somente interativo).
    - Verificação de atualização do protocolo da UI (recompila a Control UI quando o esquema de protocolo é mais recente).
    - Verificação de integridade + prompt de reinicialização.
    - Resumo de status de Skills (elegível/ausente/bloqueado) e status de Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalização de config para valores legados.
    - Migração da config Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração de navegador para configs legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento de OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS para perfis OAuth do OpenAI Codex.
    - Avisos de lista de permissões de Plugin/ferramenta quando `plugins.allow` é restritiva, mas a política de ferramentas ainda solicita curinga ou ferramentas pertencentes a Plugin.
    - Migração de estado legado no disco (sessions/agent dir/auth do WhatsApp).
    - Migração de chaves legadas do contrato de manifesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração do armazenamento legado de Cron (`jobId`, `schedule.cron`, campos delivery/payload de nível superior, payload `provider`, jobs simples de fallback de Webhook `notify: true`).
    - Migração legada de runtime-policy de agentes para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Limpeza de config obsoleta de Plugin quando Plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas de Plugin são tratadas como config de contenção inerte e são preservadas.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspeção de arquivo de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcritos de sessão para ramificações duplicadas de reescrita de prompt criadas por builds afetados de 2026.4.24.
    - Detecção de marcações de recuperação por reinicialização de subagentes travados, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada para que a inicialização não continue tratando o filho como abortado por reinicialização.
    - Verificações de integridade de estado e permissões (sessões, transcritos, diretório de estado).
    - Verificações de permissão do arquivo de config (chmod 600) ao executar localmente.
    - Integridade de autenticação do modelo: verifica expiração de OAuth, pode atualizar tokens próximos de expirar e relata estados de cooldown/desabilitado de auth-profile.
    - Detecção de diretório extra de workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Reparo de imagem de sandbox quando sandboxing está habilitado.
    - Migração de serviço legado e detecção extra de Gateway.
    - Migração de estado legado do canal Matrix (em modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (sondados a partir do Gateway em execução).
    - Auditoria de config de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza de ambiente de proxy embutido para serviços Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante instalação ou atualização.
    - Verificações de boas práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciador de versões).
    - Diagnóstico de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Avisos de segurança para políticas de DM abertas.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configs SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de pareamento inicial, upgrades pendentes de função/escopo, desvio de cache local obsoleto de token de dispositivo e desvio de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Verificação de systemd linger no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/quase-limite para arquivos de contexto).
    - Verificação de status de conclusão do shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava config atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Backfill e reset da UI Dreams

A cena Dreams da Control UI inclui ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de trabalho de Dreaming fundamentado. Essas ações usam métodos RPC do Gateway no estilo do doctor, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** varre arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM fundamentado e grava entradas reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas marcadas de diário de backfill de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas staged de curto prazo fundamentadas que vieram de replay histórico e ainda não acumularam recall ao vivo ou suporte diário.

O que elas **não** fazem por si só:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não colocam automaticamente candidatos fundamentados no armazenamento de promoção de curto prazo ao vivo, a menos que você execute explicitamente o caminho staged da CLI primeiro

Se você quiser que o replay histórico fundamentado influencie a faixa normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso coloca candidatos duráveis fundamentados no armazenamento de Dreaming de curto prazo, mantendo `DREAMS.md` como superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Se isto for um checkout git e o doctor estiver sendo executado interativamente, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Se a config contiver formatos de valores legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o esquema atual.

    Isso inclui campos planos legados de Talk. A config pública atual de Talk é `talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` no mapa de provedores.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    curinga ou entradas de ferramentas pertencentes a Plugin. `tools.allow: ["*"]` corresponde apenas a ferramentas
    de Plugins que realmente carregam; ele não contorna a lista exclusiva de permissões de Plugin.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Quando a config contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração que ele aplicou.
    - Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

    O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um formato de config legado, então configs obsoletas são reparadas sem intervenção manual. Migrações do armazenamento de jobs Cron são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - Para canais com `accounts` nomeadas, mas com valores de canal de nível superior de conta única remanescentes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; o Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para timeouts lentos de provedor/modelo
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de retransmissão de extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do gateway também ignora provedores cujo `api` está definido como um valor de enumeração futuro ou desconhecido, em vez de falhar de modo fechado)

    Os avisos do Doctor também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o Doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o Doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O Doctor avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração do navegador e prontidão do Chrome MCP">
    Se a configuração do seu navegador ainda apontar para o caminho removido da extensão do Chrome, o Doctor a normaliza para o modelo atual de anexação Chrome MCP local do host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O Doctor também audita o caminho Chrome MCP local do host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O Doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local do host ainda exige:

    - um navegador baseado em Chromium 144+ no host gateway/node
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui trata apenas dos pré-requisitos de anexação local. Existing-session mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de downloads e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto.

    Esta verificação **não** se aplica a fluxos Docker, sandbox, remote-browser ou outros fluxos headless. Eles continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o Doctor sonda o endpoint de autorização da OpenAI para verificar se a pilha local Node/OpenSSL TLS consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o Doctor imprime orientações de correção específicas da plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo se o Gateway estiver íntegro.
  </Accordion>
  <Accordion title="2e. Substituições de provedor OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem sombrear o caminho integrado do provedor OAuth do Codex que versões mais novas usam automaticamente. O Doctor avisa quando vê essas configurações antigas de transporte junto com o OAuth do Codex para que você possa remover ou reescrever a substituição de transporte obsoleta e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições somente de cabeçalho ainda são compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Avisos de rota do Plugin Codex">
    Quando o Plugin Codex incluído está habilitado, o Doctor também verifica se referências de modelo primário `openai-codex/*` ainda são resolvidas pelo executor PI padrão. Essa combinação é válida quando você quer autenticação OAuth/assinatura do Codex por meio do PI, mas é fácil confundi-la com o harness nativo do servidor de app do Codex. O Doctor avisa e aponta para o formato explícito do servidor de app: `openai/*` mais `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    O Doctor não corrige isso automaticamente porque as duas rotas são válidas:

    - `openai-codex/*` + PI significa "usar autenticação OAuth/assinatura do Codex pelo executor normal do OpenClaw."
    - `openai/*` + `runtime: "codex"` significa "executar o turno incorporado pelo servidor de app nativo do Codex."
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex a partir do chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx."

    Se o aviso aparecer, escolha a rota pretendida e edite a configuração manualmente. Mantenha o aviso como está quando o OAuth do PI Codex for intencional.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout de disco)">
    O Doctor pode migrar layouts em disco mais antigos para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID da conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o Doctor emitirá avisos quando deixar alguma pasta legada para trás como backup. O Gateway/CLI também migra automaticamente o armazenamento de sessões legadas + diretório do agente na inicialização para que histórico/autenticação/modelos caiam no caminho por agente sem uma execução manual do Doctor. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores de fala agora compara por igualdade estrutural, então diffs apenas de ordem de chaves não acionam mais alterações `doctor --fix` repetidas sem efeito.

  </Accordion>
  <Accordion title="3a. Migrações de manifesto de Plugin legado">
    O Doctor verifica todos os manifestos de Plugin instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Essa migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações de armazenamento Cron legado">
    O Doctor também verifica o armazenamento de jobs Cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de job que o agendador ainda aceita por compatibilidade.

    As limpezas Cron atuais incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` do payload → `delivery.channel` explícito
    - jobs simples legados de fallback de Webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O Doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem alterar o comportamento. Se um job combina fallback legado de notificação com um modo de entrega não Webhook existente, o Doctor avisa e deixa esse job para revisão manual.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueios de sessão">
    O Doctor verifica todos os diretórios de sessão de agente em busca de arquivos obsoletos de bloqueio de gravação — arquivos deixados para trás quando uma sessão saiu de forma anormal. Para cada arquivo de bloqueio encontrado, ele informa: o caminho, PID, se o PID ainda está ativo, idade do bloqueio e se ele é considerado obsoleto (PID morto ou com mais de 30 minutos). No modo `--fix` / `--repair`, ele remove automaticamente arquivos de bloqueio obsoletos; caso contrário, imprime uma nota e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    O Doctor verifica arquivos JSONL de sessão de agente em busca do formato de ramificação duplicada criado pelo bug de reescrita de transcrição de prompt de 2026.4.24: um turno de usuário abandonado com contexto interno de runtime do OpenClaw mais um irmão ativo contendo o mesmo prompt de usuário visível. No modo `--fix` / `--repair`, o Doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa para que o histórico do Gateway e os leitores de memória não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco encefálico operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O Doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não é possível recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a capacidade de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma incompatibilidade de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com a nuvem no macOS**: avisa quando o estado é resolvido em iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado é resolvido para uma origem de montagem `mmcblk*`, porque E/S aleatória baseada em SD ou eMMC pode ser mais lenta e desgastar mais rápido durante gravações de sessões e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: avisa quando entradas de sessão recentes têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está acumulando).
    - **Múltiplos diretórios de estado**: avisa quando várias pastas `~/.openclaw` existem em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete do modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` é legível por grupo/todos e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade da autenticação de modelos (expiração do OAuth)">
    O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de token de configuração da Anthropic. Solicitações de atualização só aparecem ao executar interativamente (TTY); `--non-interactive` pula tentativas de atualização.

    Quando uma atualização OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor pedindo para você entrar novamente), o doctor informa que a reautenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a ser executado.

    O doctor também relata perfis de autenticação que estão temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de faturamento/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo dos hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao catálogo e à lista de permissões e avisa quando ela não puder ser resolvida ou for proibida.
  </Accordion>
  <Accordion title="7. Reparo da imagem de sandbox">
    Quando o sandbox está habilitado, o doctor verifica imagens Docker e oferece criar ou trocar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Dependências de runtime de Plugin incluído">
    O doctor verifica dependências de runtime apenas para plugins incluídos que estão ativos na configuração atual ou habilitados pelo padrão do manifesto incluído, por exemplo `plugins.entries.discord.enabled: true`, o legado `channels.discord.enabled: true`, `models.providers.*` configurados / refs de modelo de agente, ou um Plugin incluído habilitado por padrão sem propriedade de provedor. Se alguma estiver ausente, o doctor relata os pacotes e os instala no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Plugins externos ainda usam `openclaw plugins install` / `openclaw plugins update`; o doctor não instala dependências para caminhos arbitrários de Plugin.

    Durante o reparo do doctor, instalações npm de dependências de runtime incluídas relatam progresso por spinner em sessões TTY e progresso periódico por linha em saída encadeada/headless. O Gateway e a CLI local também podem reparar dependências de runtime de Plugin incluído ativo sob demanda antes de importar um Plugin incluído. Essas instalações são limitadas à raiz de instalação de runtime do Plugin, executadas com scripts desabilitados, não gravam um package lock e são protegidas por um bloqueio da raiz de instalação para que inícios simultâneos da CLI ou do Gateway não modifiquem a mesma árvore `node_modules` ao mesmo tempo.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O doctor detecta serviços legados de Gateway (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenClaw usando a porta atual do Gateway. Ele também pode procurar serviços extras semelhantes ao Gateway e imprimir dicas de limpeza. Serviços de Gateway OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras".

    No Linux, se o serviço de Gateway em nível de usuário estiver ausente mas existir um serviço de Gateway OpenClaw em nível de sistema, o doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`, depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor do sistema for dono do ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas são não fatais; os erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é ignorada completamente.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivos e desvio de autenticação">
    O doctor agora inspeciona o estado de pareamento de dispositivos como parte da verificação normal de integridade.

    O que ele relata:

    - solicitações pendentes de primeiro pareamento
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos desviam da linha de base de pareamento aprovada
    - entradas de token de dispositivo armazenadas em cache localmente para a máquina atual que são anteriores a uma rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

    O doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e reaprove um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a falha comum de "já pareado, mas ainda recebendo pareamento obrigatório": o doctor agora distingue o primeiro pareamento de upgrades pendentes de função/escopo e de desvios de token/identidade de dispositivo obsoletos.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O doctor emite avisos quando um provedor está aberto a DMs sem uma lista de permissões, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se estiver executando como um serviço de usuário systemd, o doctor garante que lingering esteja habilitado para que o Gateway continue ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do workspace (skills, plugins e diretórios legados)">
    O doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta skills elegíveis, com requisitos ausentes e bloqueadas por lista de permissões.
    - **Diretórios de workspace legados**: avisa quando `~/openclaw` ou outros diretórios de workspace legados existem ao lado do workspace atual.
    - **Status de Plugin**: conta plugins habilitados/desabilitados/com erro; lista IDs de Plugin para quaisquer erros; relata capacidades de Plugin do bundle.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros em tempo de carregamento emitidos pelo registro de Plugin.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O doctor verifica se arquivos de bootstrap do workspace (por exemplo `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão perto ou acima do orçamento de caracteres configurado. Ele relata, por arquivo, contagens de caracteres brutos vs. injetados, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados como fração do orçamento total. Quando arquivos são truncados ou estão perto do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de Plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um Plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse Plugin: entradas `channels.<id>`, destinos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal não existe mais, mas a configuração ainda pede ao gateway para se vincular a ele.
  </Accordion>
  <Accordion title="11c. Compleção de shell">
    O doctor verifica se a completação por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão de completação dinâmica lenta (`source <(openclaw completion ...)`), o doctor o atualiza para a variante de arquivo em cache mais rápida.
    - Se a completação está configurada no perfil, mas o arquivo de cache está ausente, o doctor regenera o cache automaticamente.
    - Se nenhuma completação estiver configurada, o doctor solicita instalá-la (somente modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O doctor verifica a prontidão da autenticação por token do gateway local.

    - Se o modo de token precisar de um token e nenhuma origem de token existir, o doctor oferece gerar um.
    - Se `gateway.auth.token` é gerenciado por SecretRef, mas está indisponível, o doctor avisa e não o sobrescreve com texto puro.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família de status para reparos de configuração direcionados.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais configuradas do bot quando disponíveis.
    - Se o token do bot Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor relata que a credencial está configurada-mas-indisponível e pula a resolução automática em vez de falhar ou relatar incorretamente o token como ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinicialização">
    O doctor executa uma verificação de integridade e oferece reiniciar o Gateway quando ele parece estar não íntegro.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O doctor verifica se o provedor de embeddings de busca de memória configurado está pronto para o agente padrão. O comportamento depende do backend e provedor configurados:

    - **Backend QMD**: testa se o binário `qmd` está disponível e pode ser iniciado. Se não estiver, imprime orientação de correção incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL de modelo remoto/baixável reconhecida. Se ausente, sugere mudar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado em cache da sondagem do gateway está disponível (o gateway estava íntegro no momento da verificação), o doctor cruza o resultado com a configuração visível pela CLI e observa qualquer discrepância. O doctor não inicia um novo ping de embeddings no caminho padrão; use o comando de status profundo da memória quando quiser uma verificação ativa do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em tempo de execução.

  </Accordion>
  <Accordion title="14. Avisos de status dos canais">
    Se o gateway estiver íntegro, o doctor executa uma sondagem de status dos canais e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração do supervisor instalada (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências de network-online do systemd e atraso de reinicialização). Quando encontra uma divergência, ele recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita as solicitações de reparo padrão.
    - `openclaw doctor --repair` aplica as correções recomendadas sem solicitações.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor em modo somente leitura para o ciclo de vida do serviço do gateway. Ele ainda relata a integridade do serviço e executa reparos que não sejam de serviço, mas ignora instalação/início/reinício/bootstrap do serviço, reescritas de configuração do supervisor e limpeza de serviço legado porque um supervisor externo é proprietário desse ciclo de vida.
    - No Linux, o doctor não reescreve metadados de comando/entrypoint enquanto a unidade systemd correspondente do gateway está ativa. Ele também ignora unidades extras inativas semelhantes a gateway que não sejam legadas durante a verificação de serviços duplicados, para que arquivos de serviço complementares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores de token em texto puro resolvidos nos metadados de ambiente do serviço do supervisor.
    - O doctor detecta valores de ambiente de serviço gerenciados por `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Windows Scheduled Task incorporavam inline e reescreve os metadados do serviço para que esses valores sejam carregados da fonte de tempo de execução em vez da definição do supervisor.
    - O doctor detecta quando o comando do serviço ainda fixa uma `--port` antiga depois que `gateway.port` muda e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, o doctor bloqueia o caminho de instalação/reparo com orientação acionável.
    - Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades systemd de usuário no Linux, as verificações de desvio de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Reparos de serviço do doctor se recusam a reescrever, parar ou reiniciar um serviço de gateway de um binário OpenClaw mais antigo quando a configuração foi gravada por último por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do gateway (padrão `18789`) e relata causas prováveis (gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Boas práticas de runtime do Gateway">
    O doctor avisa quando o serviço do gateway roda no Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    Serviços recém-instalados ou reparados mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios de fallback inferidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem no disco. Isso mantém o PATH do supervisor gerado alinhado com a mesma auditoria de PATH mínimo que o doctor executa depois.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O doctor persiste quaisquer alterações de configuração e registra metadados do assistente para gravar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre estrutura de workspace e backup com git (GitHub ou GitLab privado recomendado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
