---
read_when:
    - Você tem problemas de conectividade/autenticação e quer correções orientadas
    - Você atualizou e quer uma verificação rápida
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-06-27T17:19:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Verificações de integridade + correções rápidas para o Gateway e os canais.

Relacionado:

- Solução de problemas: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Auditoria de segurança: [Segurança](/pt-BR/gateway/security)

## Por Que Usar

`openclaw doctor` é a superfície de integridade do OpenClaw. Use-o quando o Gateway,
os canais, plugins, Skills, roteamento de modelos, estado local ou migrações de configuração
não estiverem se comportando como esperado e você quiser um comando que consiga explicar o que está
errado.

Doctor tem três posturas:

| Postura   | Comando                  | Comportamento                                                                 |
| --------- | ------------------------ | ----------------------------------------------------------------------------- |
| Inspecionar | `openclaw doctor`        | Verificações orientadas a humanos e prompts guiados.                          |
| Reparar   | `openclaw doctor --fix`  | Aplica reparos compatíveis, usando prompts a menos que o reparo não interativo seja seguro. |
| Lint      | `openclaw doctor --lint` | Achados estruturados somente leitura para CI, preflight e gates de revisão.   |

Prefira `--lint` quando a automação precisar de um resultado estável. Prefira `--fix` quando um
operador humano quiser intencionalmente que o doctor edite configuração ou estado.

## Exemplos

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

Para permissões específicas de canal, use as sondagens de canal em vez de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

A sondagem direcionada de capacidades do Discord informa as permissões efetivas do bot no canal; a sondagem de status audita canais do Discord configurados e destinos de entrada automática em voz.

## Opções

- `--no-workspace-suggestions`: desativa sugestões de memória/pesquisa do workspace
- `--yes`: aceita os padrões sem prompt
- `--repair`: aplica reparos recomendados que não sejam de serviço sem prompt; instalações e regravações do serviço Gateway ainda exigem confirmação interativa ou comandos explícitos do Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configuração de serviço personalizada quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não sejam de serviço
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--allow-exec`: permite que o doctor execute SecretRefs exec configurados ao verificar segredos
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway e informa handoffs recentes de reinicialização do supervisor do Gateway
- `--lint`: executa verificações de integridade modernizadas em modo somente leitura e emite achados diagnósticos
- `--post-upgrade`: executa sondagens de compatibilidade de plugins pós-upgrade; emite achados em stdout; sai com código 1 se houver qualquer achado de nível de erro
- `--json`: com `--lint`, emite achados JSON em vez de saída para humanos; com `--post-upgrade`, emite um envelope JSON legível por máquina (`{ probesRun, findings }`)
- `--severity-min <level>`: com `--lint`, descarta achados abaixo de `info`, `warning` ou `error`
- `--all`: com `--lint`, executa todas as verificações registradas, incluindo verificações opt-in excluídas do conjunto de automação padrão
- `--skip <id>`: com `--lint`, ignora um id de verificação; repita para ignorar mais de uma
- `--only <id>`: com `--lint`, executa apenas um id de verificação; repita para executar um pequeno conjunto selecionado

## Modo lint

`openclaw doctor --lint` é a postura de automação somente leitura para verificações do doctor.
Ele usa o caminho estruturado de verificação de integridade, não mostra prompts e não repara
nem regrava configuração/estado. Use-o em CI, scripts de preflight e fluxos de revisão
quando quiser achados legíveis por máquina em vez de prompts guiados de reparo.
Opções de saída de lint, como `--json`, `--severity-min`, `--all`, `--only` e `--skip`,
só são aceitas com `--lint`.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

A saída para humanos é compacta:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

A saída JSON é a superfície de script para execuções de lint:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Comportamento de saída:

- `0`: nenhum achado no limite de severidade selecionado ou acima dele
- `1`: pelo menos um achado atende ao limite selecionado
- `2`: falha de comando/runtime antes que achados de lint possam ser produzidos

`--severity-min` controla tanto os achados visíveis quanto o limite de saída. Por
exemplo, `openclaw doctor --lint --severity-min error` pode não imprimir achados e
sair com `0` mesmo quando existirem achados `info` ou `warning` de severidade menor.

`--all` controla quais verificações são selecionadas antes da filtragem por severidade. A
execução de lint padrão é o gate de automação estável e exclui verificações que são
intencionalmente opt-in porque são profundas, históricas ou mais propensas a
expor resíduo legado reparável. Use `--all` quando quiser o inventário completo de lint
sem listar cada id de verificação. `--only <id>` continua sendo o seletor mais preciso
e pode executar qualquer verificação registrada por id.

## Verificações de Integridade Estruturadas

Verificações modernizadas do doctor usam um pequeno contrato estruturado:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` alimenta `doctor --lint`. `repair()` é opcional e só é considerado
por `doctor --fix` / `doctor --repair`. Verificações que ainda não migraram para este
formato continuam usando o fluxo legado de contribuição do doctor.

A separação é intencional: `detect()` é dono do diagnóstico, enquanto `repair()` é dono de
informar o que alterou ou alteraria. Contextos de reparo podem carregar solicitações
`dryRun`/`diff`, e resultados de reparo podem retornar `diffs` estruturados para
edições de configuração/arquivo, além de `effects` para serviço, processo, pacote, estado ou outros
efeitos colaterais. Isso permite que verificações convertidas avancem em direção a `doctor --fix --dry-run`
e relatórios de diff sem mover o planejamento de mutação para `detect()`.

`repair()` informa se tentou o reparo solicitado com `status:
"repaired" | "skipped" | "failed"`. Status omitido significa `repaired`, então verificações
simples de reparo só precisam retornar alterações. Quando o reparo retorna `skipped` ou
`failed`, o doctor informa o motivo e não executa validação para essa verificação.

Após um reparo estruturado bem-sucedido, o doctor executa novamente `detect()` com os
achados reparados como escopo. Verificações podem usar achados selecionados, caminhos ou valores `ocPath`
para validação focada. Se o achado ainda estiver presente, o doctor informa um
aviso de reparo em vez de tratar a alteração como concluída silenciosamente.

Um achado inclui:

| Campo             | Finalidade                                             |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Id estável para filtros skip/only e allowlists de CI.  |
| `severity`        | `info`, `warning` ou `error`.                          |
| `message`         | Declaração do problema legível por humanos.            |
| `path`            | Configuração, arquivo ou caminho lógico quando disponível. |
| `line` / `column` | Localização de origem quando disponível.               |
| `ocPath`          | Endereço `oc://` preciso quando uma verificação pode apontar para um. |
| `fixHint`         | Ação sugerida para o operador ou resumo do reparo.     |

Verificações modernizadas do core doctor permanecem anexadas à contribuição ordenada do doctor
que possui seu comportamento humano de `doctor` / `doctor --fix`. O registro compartilhado estruturado
de integridade é o ponto de extensão: verificações empacotadas e apoiadas por plugins executam
após as verificações do core doctor quando o pacote proprietário as registra no caminho ativo
do comando. O subcaminho `openclaw/plugin-sdk/health` expõe o mesmo
contrato para esses consumidores de extensão.

## Seleção de Verificações

Use `--only` e `--skip` quando um fluxo quiser um gate focado:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` e `--skip` aceitam ids completos de verificação e podem ser repetidos. Se um id `--only`
não estiver registrado, nenhuma verificação executará para esse id; use os campos `checksRun`
e `checksSkipped` do comando para verificar se um gate focado está selecionando as verificações que você
espera.

## Modo pós-upgrade

`openclaw doctor --post-upgrade` executa sondagens de compatibilidade de plugins destinadas a serem
encadeadas após uma build ou upgrade. Achados são emitidos em stdout; o comando
sai com código 1 se qualquer achado tiver `level: "error"`. Adicione `--json` para receber um
envelope legível por máquina (`{ probesRun, findings }`) adequado para CI, a
skill comunitária `fork-upgrade` e outras ferramentas de smoke pós-upgrade. Se o
índice de plugins instalado estiver ausente ou malformado, o modo JSON ainda emite esse
envelope com um achado de erro `plugin.index_unavailable`.

Observações:

- No modo Nix (`OPENCLAW_NIX_MODE=1`), as verificações somente leitura do doctor ainda funcionam, mas `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` ficam desativados porque `openclaw.json` é imutável. Edite a fonte Nix desta instalação em vez disso; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
- Prompts interativos (como correções de chaveiro/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções sem interface (Cron, Telegram, sem terminal) ignorarão os prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento ansioso de plugins para que verificações de integridade sem interface permaneçam rápidas. Sessões interativas do doctor ainda carregam as superfícies de plugin necessárias pelo fluxo legado de integridade e reparo.
- `--lint` é mais estrito que `--non-interactive`: ele é sempre somente leitura, nunca solicita entrada e nunca aplica migrações seguras. Execute `doctor --fix` ou `doctor --repair` quando quiser que o doctor faça alterações.
- Por padrão, o doctor não executa SecretRefs `exec` ao verificar segredos. Use `openclaw doctor --allow-exec` ou `openclaw doctor --lint --allow-exec` somente quando você intencionalmente quiser que o doctor execute esses resolvedores de segredos configurados.
- `--fix` (alias de `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- Verificações de integridade modernizadas podem expor um caminho `repair()` para `doctor --fix`; verificações que não expõem um continuam pelo fluxo de reparo existente do doctor.
- `doctor --fix --non-interactive` relata definições de serviço do Gateway ausentes ou obsoletas, mas não as instala nem reescreve fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você intencionalmente quiser substituir o launcher.
- Verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções sem interface os deixam no lugar.
- O doctor também varre `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de jobs Cron e os reescreve antes de importar linhas canônicas para o SQLite.
- O doctor relata jobs Cron com substituições explícitas de `payload.model`, incluindo contagens por namespace de provedor e divergências em relação a `agents.defaults.model`, para que jobs agendados que não herdam o modelo padrão fiquem visíveis durante investigações de autenticação ou cobrança.
- No Linux, o doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas indisponibilidades do Gateway do WhatsApp quando o Cron não tem o ambiente de barramento de usuário do systemd.
- Quando o WhatsApp está habilitado, o doctor verifica se há um loop de eventos degradado do Gateway com clientes `openclaw-tui` locais ainda em execução. `doctor --fix` interrompe somente clientes TUI locais verificados para que respostas do WhatsApp não fiquem enfileiradas atrás de loops obsoletos de atualização da TUI.
- O doctor reescreve refs de modelo legadas `openai-codex/*` para refs canônicas `openai/*` em modelos primários, fallbacks, modelos de geração de imagem/vídeo, substituições de Heartbeat/subagente/Compaction, hooks, substituições de modelo de canais e pins obsoletos de rota de sessão. `--fix` também migra perfis de autenticação legados `openai-codex:*` e entradas `auth.order.openai-codex` para `openai:*`, move a intenção do Codex para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo, remove pins obsoletos de runtime de agente inteiro/sessão e mantém refs reparadas de agentes OpenAI no roteamento de autenticação do Codex em vez de autenticação direta por chave de API da OpenAI.
- O doctor limpa estado legado de preparação de dependências de plugin criado por versões antigas do OpenClaw e revincula o pacote host `openclaw` para plugins npm gerenciados que o declaram como dependência peer. Ele também repara plugins baixáveis ausentes que são referenciados pela configuração, como `plugins.entries`, canais configurados, configurações configuradas de provedor/busca ou runtimes de agente configurados. Durante atualizações de pacote, o doctor pula o reparo de plugins do gerenciador de pacotes até que a troca de pacote seja concluída; execute novamente `openclaw doctor --fix` depois se um plugin configurado ainda precisar de recuperação. Se o download falhar, o doctor relata o erro de instalação e preserva a entrada de plugin configurada para a próxima tentativa de reparo.
- O doctor repara configuração obsoleta de plugins removendo ids de plugins ausentes de `plugins.allow`/`plugins.deny`/`plugins.entries`, além da configuração de canal correspondente pendente, alvos de Heartbeat e substituições de modelo de canais quando a descoberta de plugins está saudável.
- O doctor coloca em quarentena configuração inválida de plugin desabilitando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já pula somente esse plugin problemático para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor for dono do ciclo de vida do Gateway. O doctor ainda relata a integridade do Gateway/serviço e aplica reparos que não envolvem serviço, mas pula instalação/início/reinício/bootstrap de serviço e limpeza de serviço legado.
- No Linux, o doctor ignora unidades systemd extras inativas semelhantes ao Gateway e não reescreve metadados de comando/entrypoint para um serviço Gateway systemd em execução durante o reparo. Interrompa o serviço primeiro ou use `openclaw gateway install --force` quando você intencionalmente quiser substituir o launcher ativo.
- O doctor migra automaticamente a configuração Talk plana legada (`talk.voiceId`, `talk.modelId` e afins) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O doctor inclui uma verificação de prontidão de busca em memória e pode recomendar `openclaw configure --section model` quando credenciais de embedding estão ausentes.
- O doctor avisa quando nenhum dono de comando está configurado. O dono de comando é a conta do operador humano autorizada a executar comandos exclusivos do dono e aprovar ações perigosas. O pareamento por DM apenas permite que alguém converse com o bot; se você aprovou um remetente antes de existir o bootstrap do primeiro dono, defina `commands.ownerAllowFrom` explicitamente.
- O doctor relata uma nota informativa quando agentes em modo Codex estão configurados e ativos pessoais da CLI Codex existem no diretório inicial Codex do operador. Inicializações locais do app-server do Codex usam diretórios iniciais isolados por agente, então instale primeiro o plugin Codex se necessário e depois use `openclaw migrate plan codex` para inventariar ativos que devem ser promovidos deliberadamente.
- O doctor remove o aposentado `plugins.entries.codex.config.codexDynamicToolsProfile`; o app-server do Codex sempre mantém ferramentas de workspace nativas do Codex como nativas.
- O doctor avisa quando Skills permitidas para o agente padrão estão indisponíveis no ambiente de runtime atual porque bins, variáveis de ambiente, configuração ou requisitos de SO estão ausentes. `doctor --fix` pode desabilitar essas Skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente em vez disso quando quiser manter a skill ativa.
- Se o modo sandbox estiver habilitado, mas o Docker estiver indisponível, o doctor relata um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro sandbox ou diretórios de shards estiverem presentes (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` ou `~/.openclaw/sandbox/browsers/`), o doctor os relata; `openclaw doctor --fix` migra entradas válidas para o SQLite e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, o doctor relata um aviso somente leitura e não grava credenciais fallback em texto claro. Para SecretRefs baseados em exec, o doctor pula a execução, a menos que `--allow-exec` esteja presente.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, o doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações do diretório de estado, o doctor avisa quando contas padrão habilitadas do Telegram ou Discord dependem de fallback de env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho de comando atual. Se a inspeção do token estiver indisponível, o doctor relata um aviso e pula a resolução automática nessa passagem.

## macOS: substituições de env do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de "não autorizado".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
