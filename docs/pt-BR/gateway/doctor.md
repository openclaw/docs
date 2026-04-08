---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
summary: 'Comando Doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-04-08T02:15:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3761a222d9db7088f78215575fa84e5896794ad701aa716e8bf9039a4424dca6
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige
configuração/estado desatualizados, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Headless / automação

```bash
openclaw doctor --yes
```

Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de reinicialização/serviço/sandbox, quando aplicável).

```bash
openclaw doctor --repair
```

Aplica os reparos recomendados sem solicitar confirmação (reparos + reinicializações quando seguro).

```bash
openclaw doctor --repair --force
```

Aplica também reparos agressivos (sobrescreve configurações personalizadas do supervisor).

```bash
openclaw doctor --non-interactive
```

Executa sem solicitações e aplica apenas migrações seguras (normalização de configuração + movimentação de estado em disco). Ignora ações de reinicialização/serviço/sandbox que exigem confirmação humana.
Migrações de estado legado são executadas automaticamente quando detectadas.

```bash
openclaw doctor --deep
```

Examina serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

Se você quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

- Atualização opcional antes da execução para instalações via git (apenas interativo).
- Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais novo).
- Verificação de integridade + prompt de reinicialização.
- Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.
- Normalização de configuração para valores legados.
- Migração da configuração de Talk de campos legados planos `talk.*` para `talk.provider` + `talk.providers.<provider>`.
- Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
- Avisos de sobrescrita do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
- Verificação de pré-requisitos de TLS do OAuth para perfis OpenAI Codex OAuth.
- Migração de estado legado em disco (sessões/dir do agent/autenticação do WhatsApp).
- Migração de chaves legadas do contrato do manifesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migração do armazenamento legado de cron (`jobId`, `schedule.cron`, campos de delivery/payload no nível superior, payload `provider`, jobs simples de fallback de webhook com `notify: true`).
- Inspeção de arquivos de bloqueio de sessão e limpeza de locks obsoletos.
- Verificações de integridade e permissões do estado (sessões, transcrições, dir de estado).
- Verificações de permissão do arquivo de configuração (`chmod 600`) ao executar localmente.
- Integridade de autenticação de modelos: verifica expiração de OAuth, pode renovar tokens prestes a expirar e informa estados de cooldown/desativação de perfis de autenticação.
- Detecção de diretório de workspace extra (`~/openclaw`).
- Reparo de imagem sandbox quando o sandboxing está ativado.
- Migração de serviço legado e detecção de gateways extras.
- Migração de estado legado do canal Matrix (em modo `--fix` / `--repair`).
- Verificações de runtime do gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
- Avisos de status de canal (sondados a partir do gateway em execução).
- Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de boas práticas de runtime do gateway (Node vs Bun, caminhos de gerenciador de versão).
- Diagnóstico de colisão de porta do gateway (padrão `18789`).
- Avisos de segurança para políticas de DM abertas.
- Verificações de autenticação do gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações de token via SecretRef).
- Verificação de linger do systemd no Linux.
- Verificação do tamanho do arquivo bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
- Verificação do status de shell completion e instalação/atualização automática.
- Verificação de prontidão do provedor de embeddings para busca em memória (modelo local, chave de API remota ou binário QMD).
- Verificações de instalação via código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
- Grava configuração atualizada + metadados do assistente.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (instalações via git)

Se isto for um checkout git e o doctor estiver sendo executado interativamente, ele oferece
atualizar (fetch/rebase/build) antes de executar o doctor.

### 1) Normalização de configuração

Se a configuração contiver formatos de valor legados (por exemplo `messages.ackReaction`
sem uma sobrescrita específica de canal), o doctor os normaliza para o
schema atual.

Isso inclui campos planos legados de Talk. A configuração pública atual de Talk é
`talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` para o mapa de provedores.

### 2) Migrações de chaves de configuração legadas

Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem
para você rodar `openclaw doctor`.

O doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração que ele aplicou.
- Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

O Gateway também executa automaticamente as migrações do doctor na inicialização quando detecta um
formato de configuração legado, assim configurações desatualizadas são reparadas sem intervenção manual.
As migrações do armazenamento de jobs cron são tratadas por `openclaw doctor --fix`.

Migrações atuais:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` no nível superior
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- legado `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canais com `accounts` nomeadas, mas com valores de canal de conta única ainda no nível superior, mover esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- remover `browser.relayBindHost` (configuração legada de relay da extensão)

Os avisos do doctor também incluem orientações de conta padrão para canais com múltiplas contas:

- Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` estiver definido para um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

### 2b) Sobrescritas de provedor OpenCode

Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go`
manualmente, isso sobrescreve o catálogo OpenCode incluído de `@mariozechner/pi-ai`.
Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você
possa remover a sobrescrita e restaurar o roteamento por API + custos por modelo.

### 2c) Migração do navegador e prontidão do Chrome MCP

Se a configuração do seu navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor
a normaliza para o modelo atual de conexão host-local do Chrome MCP:

- `browser.profiles.*.driver: "extension"` torna-se `"existing-session"`
- `browser.relayBindHost` é removido

O doctor também audita o caminho host-local do Chrome MCP quando você usa `defaultProfile:
"user"` ou um perfil `existing-session` configurado:

- verifica se o Google Chrome está instalado no mesmo host para perfis
  de conexão automática padrão
- verifica a versão detectada do Chrome e avisa quando ela é inferior ao Chrome 144
- lembra você de ativar a depuração remota na página de inspeção do navegador (por
  exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

O doctor não pode ativar essa configuração no Chrome por você. O Chrome MCP host-local
ainda exige:

- um navegador baseado em Chromium 144+ no host do gateway/node
- o navegador em execução localmente
- depuração remota ativada nesse navegador
- aprovação do primeiro prompt de consentimento de conexão no navegador

A prontidão aqui se refere apenas aos pré-requisitos de conexão local. Existing-session mantém
os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação
de PDF, interceptação de download e ações em lote ainda exigem um
navegador gerenciado ou perfil CDP bruto.

Esta verificação **não** se aplica a fluxos Docker, sandbox, remote-browser ou outros
fluxos headless. Eles continuam usando CDP bruto.

### 2d) Pré-requisitos de TLS do OAuth

Quando um perfil OpenAI Codex OAuth está configurado, o doctor sonda o endpoint de
autorização da OpenAI para verificar se a stack local de TLS do Node/OpenSSL consegue
validar a cadeia de certificados. Se a sonda falhar com um erro de certificado (por
exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado),
o doctor imprime orientações de correção específicas da plataforma. No macOS com Node do Homebrew, a
correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sonda é executada
mesmo se o gateway estiver íntegro.

### 2c) Sobrescritas de provedor Codex OAuth

Se você adicionou anteriormente configurações legadas de transporte OpenAI em
`models.providers.openai-codex`, elas podem sombrear o caminho do provedor
Codex OAuth incluído que as versões mais novas usam automaticamente. O doctor avisa quando vê
essas configurações antigas de transporte junto com o Codex OAuth para que você possa remover ou reescrever
a sobrescrita de transporte desatualizada e recuperar o comportamento incluído de roteamento/fallback.
Proxies personalizados e sobrescritas apenas de cabeçalho continuam sendo compatíveis e não
acionam este aviso.

### 3) Migrações de estado legado (layout em disco)

O doctor pode migrar layouts antigos em disco para a estrutura atual:

- Armazenamento de sessões + transcrições:
  - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
- Diretório do agent:
  - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticação do WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
  - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de conta padrão: `default`)

Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando
deixar qualquer pasta legada para trás como backup. O Gateway/CLI também migra automaticamente
as sessões legadas + diretório do agent na inicialização para que histórico/autenticação/modelos caiam
no caminho por agent sem a necessidade de executar o doctor manualmente. A autenticação do WhatsApp é
intencionalmente migrada apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores de Talk agora
compara por igualdade estrutural, portanto diferenças apenas de ordem de chave não disparam mais
alterações repetidas sem efeito de `doctor --fix`.

### 3a) Migrações legadas de manifesto de plugin

O doctor examina todos os manifestos de plugin instalados em busca de chaves de capacidade
obsoletas no nível superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts`
e reescrever o arquivo do manifesto no local. Esta migração é idempotente;
se a chave `contracts` já tiver os mesmos valores, a chave legada é removida
sem duplicar os dados.

### 3b) Migrações legadas do armazenamento de cron

O doctor também verifica o armazenamento de jobs cron (`~/.openclaw/cron/jobs.json` por padrão,
ou `cron.store` quando sobrescrito) em busca de formatos antigos de job que o agendador ainda
aceita por compatibilidade.

As limpezas atuais de cron incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload no nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de delivery no nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de delivery `provider` no payload → `delivery.channel` explícito
- jobs simples legados de fallback de webhook com `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem
alterar o comportamento. Se um job combinar fallback legado de notify com um modo de
delivery não webhook já existente, o doctor avisa e deixa esse job para revisão manual.

### 3c) Limpeza de lock de sessão

O doctor examina cada diretório de sessão de agent em busca de arquivos de write-lock obsoletos — arquivos deixados
quando uma sessão foi encerrada de forma anormal. Para cada arquivo de lock encontrado, ele informa:
o caminho, PID, se o PID ainda está ativo, idade do lock e se ele é
considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`
ele remove automaticamente arquivos de lock obsoletos; caso contrário, imprime uma observação e
instrui você a executar novamente com `--fix`.

### 4) Verificações de integridade do estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o centro operacional. Se ele desaparecer, você perde
sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

O doctor verifica:

- **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar
  o diretório e lembra que ele não pode recuperar dados ausentes.
- **Permissões do diretório de estado**: verifica permissões de escrita; oferece reparar permissões
  (e emite uma dica de `chown` quando detecta incompatibilidade de proprietário/grupo).
- **Diretório de estado sincronizado em nuvem no macOS**: avisa quando o estado está em
  iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` porque caminhos com sincronização podem causar I/O mais lento
  e condições de corrida de lock/sincronização.
- **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado está em uma origem
  de montagem `mmcblk*`, porque I/O aleatório em SD ou eMMC pode ser mais lento e causar maior desgaste
  sob gravações de sessão e credenciais.
- **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessão são
  necessários para persistir o histórico e evitar falhas `ENOENT`.
- **Incompatibilidade de transcrição**: avisa quando entradas recentes de sessão têm arquivos
  de transcrição ausentes.
- **Sessão principal “JSONL de 1 linha”**: sinaliza quando a transcrição principal tem apenas uma
  linha (o histórico não está se acumulando).
- **Múltiplos diretórios de estado**: avisa quando existem múltiplas pastas `~/.openclaw` em
  diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro local (o histórico pode
  se dividir entre instalações).
- **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo
  no host remoto (o estado fica lá).
- **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` está
  legível por grupo/outros e oferece restringir para `600`.

### 5) Integridade da autenticação de modelos (expiração de OAuth)

O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão
prestes a expirar/expirados e pode renová-los quando for seguro. Se o perfil OAuth/token
da Anthropic estiver desatualizado, ele sugere uma chave de API da Anthropic ou o
caminho de setup-token da Anthropic.
Prompts de renovação só aparecem quando executado interativamente (TTY); `--non-interactive`
ignora tentativas de renovação.

O doctor também informa perfis de autenticação temporariamente inutilizáveis devido a:

- cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
- desativações mais longas (falhas de cobrança/crédito)

### 6) Validação do modelo de hooks

Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao
catálogo e à allowlist e avisa quando ele não for resolvido ou não for permitido.

### 7) Reparo de imagem sandbox

Quando o sandboxing está ativado, o doctor verifica imagens Docker e oferece construir ou
mudar para nomes legados se a imagem atual estiver ausente.

### 7b) Dependências de runtime de plugin incluído

O doctor verifica se as dependências de runtime de plugins incluídos (por exemplo os
pacotes de runtime do plugin Discord) estão presentes na raiz da instalação do OpenClaw.
Se alguma estiver ausente, o doctor informa os pacotes e os instala no
modo `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrações de serviço do gateway e dicas de limpeza

O doctor detecta serviços legados do gateway (launchd/systemd/schtasks) e
oferece removê-los e instalar o serviço OpenClaw usando a porta atual do gateway.
Ele também pode examinar serviços extras semelhantes a gateway e imprimir dicas de limpeza.
Serviços do gateway OpenClaw nomeados por perfil são considerados de primeira classe e não são
sinalizados como "extras".

### 8b) Migração Matrix na inicialização

Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável,
o doctor (em modo `--fix` / `--repair`) cria um snapshot antes da migração e então
executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação
legada de estado criptografado. Ambas as etapas não são fatais; erros são registrados e a
inicialização continua. Em modo somente leitura (`openclaw doctor` sem `--fix`) esta verificação
é totalmente ignorada.

### 9) Avisos de segurança

O doctor emite avisos quando um provedor está aberto a DMs sem uma allowlist, ou
quando uma política está configurada de forma perigosa.

### 10) Linger do systemd (Linux)

Se estiver executando como um serviço de usuário do systemd, o doctor garante que o lingering esteja ativado para que o
gateway continue ativo após logout.

### 11) Status do workspace (Skills, plugins e diretórios legados)

O doctor imprime um resumo do estado do workspace para o agent padrão:

- **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
- **Diretórios legados do workspace**: avisa quando `~/openclaw` ou outros diretórios legados do workspace
  existem junto com o workspace atual.
- **Status de plugins**: conta plugins carregados/desativados/com erro; lista IDs de plugins para quaisquer
  erros; informa recursos de plugins incluídos.
- **Avisos de compatibilidade de plugins**: sinaliza plugins que têm problemas de compatibilidade com
  o runtime atual.
- **Diagnósticos de plugins**: mostra quaisquer avisos ou erros em tempo de carregamento emitidos pelo
  registro de plugins.

### 11b) Tamanho do arquivo bootstrap

O doctor verifica se arquivos bootstrap do workspace (por exemplo `AGENTS.md`,
`CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do
orçamento configurado de caracteres. Ele informa por arquivo a contagem bruta vs. injetada de caracteres, porcentagem
de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados
como fração do orçamento total. Quando arquivos são truncados ou estão próximos
do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

O doctor verifica se o tab completion está instalado para o shell atual
(zsh, bash, fish ou PowerShell):

- Se o perfil do shell usa um padrão lento de completion dinâmico
  (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida
  de arquivo em cache.
- Se o completion estiver configurado no perfil, mas o arquivo de cache estiver ausente,
  o doctor regenera o cache automaticamente.
- Se nenhum completion estiver configurado, o doctor pergunta se deve instalá-lo
  (somente modo interativo; ignorado com `--non-interactive`).

Execute `openclaw completion --write-state` para regenerar o cache manualmente.

### 12) Verificações de autenticação do gateway (token local)

O doctor verifica a prontidão da autenticação por token local do gateway.

- Se o modo token precisar de um token e não existir fonte de token, o doctor oferece gerar um.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
- `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum token SecretRef estiver configurado.

### 12b) Reparos somente leitura com reconhecimento de SecretRef

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida do runtime.

- `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família status para reparos de configuração direcionados.
- Exemplo: o reparo de `@username` para `allowFrom` / `groupAllowFrom` do Telegram tenta usar credenciais do bot configuradas quando disponíveis.
- Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho atual do comando, o doctor informa que a credencial está configurada-mas-indisponível e ignora a resolução automática em vez de falhar ou informar incorretamente que o token está ausente.

### 13) Verificação de integridade do gateway + reinicialização

O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece
não íntegro.

### 13b) Prontidão da busca em memória

O doctor verifica se o provedor de embeddings configurado para busca em memória está pronto
para o agent padrão. O comportamento depende do backend e do provedor configurados:

- **Backend QMD**: sonda se o binário `qmd` está disponível e pode ser iniciado.
  Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção manual de caminho para o binário.
- **Provedor local explícito**: verifica a presença de um arquivo de modelo local ou de uma URL de modelo remota/baixável reconhecida. Se estiver ausente, sugere mudar para um provedor remoto.
- **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se existe uma chave de API
  no ambiente ou no armazenamento de autenticação. Imprime dicas acionáveis de correção se estiver ausente.
- **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

Quando um resultado de sonda do gateway está disponível (o gateway estava íntegro no momento da
verificação), o doctor cruza esse resultado com a configuração visível na CLI e observa
qualquer discrepância.

Use `openclaw memory status --deep` para verificar a prontidão de embeddings em tempo de execução.

### 14) Avisos de status de canal

Se o gateway estiver íntegro, o doctor executa uma sonda de status de canal e informa
avisos com correções sugeridas.

### 15) Auditoria de configuração do supervisor + reparo

O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de
padrões ausentes ou desatualizados (por exemplo, dependências network-online do systemd e
atraso de reinicialização). Quando encontra incompatibilidades, ele recomenda uma atualização e pode
reescrever o arquivo de serviço/tarefa para os padrões atuais.

Observações:

- `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
- `openclaw doctor --yes` aceita os prompts de reparo padrão.
- `openclaw doctor --repair` aplica as correções recomendadas sem prompts.
- `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
- Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, o install/repair do serviço pelo doctor valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o token SecretRef configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientação acionável.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia instalação/reparo até que o modo seja definido explicitamente.
- Para unidades systemd de usuário no Linux, as verificações de divergência de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
- Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

### 16) Diagnósticos de runtime + porta do gateway

O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o
serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta
na porta do gateway (padrão `18789`) e informa causas prováveis (gateway já
em execução, túnel SSH).

### 17) Boas práticas de runtime do gateway

O doctor avisa quando o serviço do gateway está rodando em Bun ou em um caminho de Node gerenciado por versão
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node,
e caminhos de gerenciadores de versão podem falhar após atualizações porque o serviço não
carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando
disponível (Homebrew/apt/choco).

### 18) Gravação de configuração + metadados do assistente

O doctor persiste quaisquer alterações de configuração e registra metadados do assistente para registrar a
execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O doctor sugere um sistema de memória do workspace quando ele estiver ausente e imprime uma dica de backup
se o workspace ainda não estiver sob git.

Veja [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre
estrutura do workspace e backup com git (GitHub ou GitLab privado recomendado).
