---
read_when:
    - Executando testes localmente ou em integração contínua
    - Adicionando testes de regressão para bugs de modelo/provedor
    - Depuração do comportamento do Gateway + do agente
summary: 'Kit de testes: suítes unitárias/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-30T09:53:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

O OpenClaw tem três suítes Vitest (unidade/integração, e2e, ao vivo) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração).
- Como testes ao vivo descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelo/provedor.

<Note>
**Pilha de QA (qa-lab, qa-channel, faixas de transporte ao vivo)** é documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — arquitetura, superfície de comandos, autoria de cenários.
- [QA de matriz](/pt-BR/concepts/qa-matrix) — referência para `pnpm openclaw qa matrix`.
- [Canal de QA](/pt-BR/channels/qa-channel) — o Plugin de transporte sintético usado por cenários respaldados pelo repositório.

Esta página cobre a execução das suítes de teste regulares e dos executores Docker/Parallels. A seção de executores específicos de QA abaixo ([executores específicos de QA](#qa-specific-runners)) lista as invocações `qa` concretas e aponta de volta para as referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina com bastante folga: `pnpm test:max`
- Loop direto de observação do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivos agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site de QA com respaldo Docker: `pnpm qa:lab:up`
- Faixa de QA com respaldo de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você tocar em testes ou quiser confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte ao vivo (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcione um arquivo ao vivo silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Varredura de modelos ao vivo em Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa um turno de texto mais uma pequena sonda no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam um pequeno turno de imagem.
    Desative as sondas extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedor.
  - Cobertura em CI: `OpenClaw Scheduled Live And E2E Checks` diário e
    `OpenClaw Release Checks` manual chamam o fluxo reutilizável de ao vivo/E2E com
    `include_live_suites: true`, que inclui jobs separados de matriz de modelos
    ao vivo em Docker fragmentados por provedor.
  - Para novas execuções focadas em CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke de chat vinculado nativo do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma faixa ao vivo em Docker contra o caminho do app-server do Codex, vincula uma DM
    sintética do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, e então verifica uma resposta simples e um anexo de imagem
    roteados pela vinculação nativa do Plugin em vez de ACP.
- Smoke do harness do app-server do Codex: `pnpm test:docker:live-codex-harness`
  - Executa turnos de agente do Gateway pelo harness do app-server do Codex pertencente ao Plugin,
    verifica `/codex status` e `/codex models`, e por padrão exercita sondas de imagem,
    MCP de cron, subagente e Guardian. Desative a sonda de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do
    app-server do Codex. Para uma checagem focada de subagente, desative as outras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso sai após a sonda de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Checagem opcional de reforço para a superfície do comando de resgate do canal de mensagens.
    Ela exercita `/crestodian status`, enfileira uma alteração persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de gravação de auditoria/configuração.
- Smoke Docker do planejador do Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem configuração com uma CLI Claude falsa no `PATH`
    e verifica que o fallback do planejador fuzzy é traduzido para uma gravação de
    configuração tipada e auditada.
- Smoke Docker de primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa a partir de um diretório de estado vazio do OpenClaw, roteia `openclaw` puro para
    o Crestodian, aplica gravações de configuração/modelo/agente/Plugin Discord + SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de configuração Ring 0
    também é coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você precisa de apenas um caso com falha, prefira restringir testes ao vivo pelas variáveis de ambiente de lista de permissões descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das suítes de teste principais quando você precisa do realismo do QA-lab:

O CI executa o QA Lab em fluxos de trabalho dedicados. `Parity gate` roda em PRs correspondentes e
a partir de disparo manual com provedores simulados. `QA-Lab - All Lanes` roda todas as noites em
`main` e a partir de disparo manual com o gate de paridade simulado, a faixa Matrix ao vivo,
a faixa Telegram ao vivo gerenciada pelo Convex e a faixa Discord ao vivo gerenciada pelo Convex como
jobs paralelos. QA agendado e checagens de release passam Matrix `--profile fast`
explicitamente, enquanto a CLI Matrix e a entrada do fluxo manual permanecem por padrão em
`all`; o disparo manual pode fragmentar `all` em jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` e `e2ee-cli`. `OpenClaw Release Checks` executa paridade mais
as faixas rápidas Matrix e Telegram antes da aprovação de release, usando
`mock-openai/gpt-5.5` para checagens de transporte de release para que permaneçam determinísticas
e evitem a inicialização normal do Plugin de provedor. Esses gateways de transporte ao vivo desativam
a busca de memória; o comportamento de memória permanece coberto pelas suítes de paridade de QA.

Fragmentos completos de mídia ao vivo de release usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já tem
`ffmpeg` e `ffprobe`. Fragmentos Docker de modelos/backends ao vivo usam a imagem compartilhada
`ghcr.io/openclaw/openclaw-live-test:<sha>` criada uma vez por commit selecionado,
depois a puxam com `OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de reconstruí-la
dentro de cada fragmento.

- `pnpm openclaw qa suite`
  - Executa cenários de QA respaldados pelo repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers
    de Gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a contagem
    de workers, ou `--concurrency 1` para a faixa serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída com falha.
  - Oferece suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local com respaldo AIMock para cobertura experimental
    de fixture e protocolo simulado sem substituir a faixa `mock-openai`
    ciente de cenários.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o bench de inicialização do Gateway mais um pequeno pacote de cenários simulados do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado de observação de CPU
    em `.artifacts/gateway-cpu-scenarios/`.
  - Sinaliza por padrão apenas observações sustentadas de CPU quente (`--cpu-core-warn`
    mais `--hot-wall-warn-ms`), então rajadas curtas de inicialização são registradas como métricas
    sem parecerem a regressão de Gateway preso por minutos.
  - Usa artefatos `dist` construídos; execute uma build primeiro quando o checkout ainda não
    tiver saída de runtime recente.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o convidado:
    chaves de provedor baseadas em env, o caminho de configuração do provedor ao vivo de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o convidado possa escrever de volta pelo
    workspace montado.
  - Grava o relatório + resumo de QA normais mais logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com respaldo Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo de chave de API da OpenAI, configura Telegram
    por padrão, verifica que habilitar o Plugin instala dependências de runtime sob
    demanda, executa doctor e executa um turno de agente local contra um endpoint OpenAI
    simulado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma faixa de instalação empacotada
    com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke Docker determinístico do app construído para transcrições de contexto de runtime
    embutido. Ele verifica que o contexto de runtime oculto do OpenClaw é persistido como uma
    mensagem personalizada não exibida em vez de vazar para o turno visível do usuário,
    depois semeia um JSONL de sessão quebrada afetada e verifica que
    `openclaw doctor --fix` o reescreve para a ramificação ativa com um backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote candidato do OpenClaw no Docker, executa onboarding de pacote instalado,
    configura Telegram pela CLI instalada, depois reutiliza a faixa de QA do Telegram
    ao vivo com esse pacote instalado como o Gateway SUT.
  - Usa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` por padrão; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez de
    instalar a partir do registro.
  - Usa as mesmas credenciais de env do Telegram ou fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo da função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta faixa.
  - O GitHub Actions expõe esta faixa como o fluxo manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não roda em merge. O fluxo usa o ambiente
    `qa-live-shared` e leases de credenciais Convex de CI.
- O GitHub Actions também expõe `Package Acceptance` para prova de produto em execução paralela
  contra um pacote candidato. Ele aceita uma ref confiável, especificação npm publicada,
  URL HTTPS de tarball mais SHA-256, ou artefato de tarball de outra execução, faz upload
  do `openclaw-current.tgz` normalizado como `package-under-test`, depois executa o
  agendador Docker E2E existente com perfis de faixa smoke, package, product, full ou custom.
  Defina `telegram_mode=mock-openai` ou `live-frontier` para executar o fluxo de QA do Telegram
  contra o mesmo artefato `package-under-test`.
  - Prova de produto do beta mais recente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Prova de URL exata de tarball requer um digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- A prova do artefato baixa um artefato tarball de outra execução do Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala a build atual do OpenClaw no Docker, inicia o Gateway
    com OpenAI configurado e então habilita canais/plugins incluídos via edições
    de configuração.
  - Verifica que a descoberta de configuração deixa ausentes as dependências de
    runtime de Plugin não configuradas, que a primeira execução configurada do
    Gateway ou do doctor instala sob demanda as dependências de runtime de cada
    Plugin incluído, e que uma segunda reinicialização não reinstala
    dependências que já foram ativadas.
  - Também instala uma linha de base npm mais antiga conhecida, habilita o Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica que o doctor pós-atualização
    do candidato repara as dependências de runtime dos canais incluídos sem um
    reparo postinstall do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke de atualização de instalação empacotada nativa em guests do Parallels. Cada
    plataforma selecionada primeiro instala o pacote de linha de base solicitado, depois executa
    o comando `openclaw update` instalado no mesmo guest e verifica a
    versão instalada, o status da atualização, a prontidão do Gateway e uma
    interação de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` ao
    iterar em um guest. Use `--json` para o caminho do artefato de resumo e
    o status por lane.
  - A lane do OpenAI usa `openai/gpt-5.5` para a prova de interação de agente ao vivo por
    padrão. Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ao validar deliberadamente outro
    modelo OpenAI.
  - Envolva execuções locais longas em um timeout do host para que travamentos de transporte do Parallels não
    consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs de lane aninhados em `/tmp/openclaw-parallels-npm-update.*`.
    Inspecione `windows-update.log`, `macos-update.log` ou `linux-update.log`
    antes de assumir que o wrapper externo está travado.
  - A atualização do Windows pode passar de 10 a 15 minutos no reparo de doctor/runtime
    de dependências pós-atualização em um guest frio; isso ainda é saudável quando o log de debug
    npm aninhado está avançando.
  - Não execute este wrapper agregado em paralelo com lanes de smoke individuais do Parallels
    para macOS, Windows ou Linux. Elas compartilham estado da VM e podem colidir na
    restauração de snapshot, no serviço de pacotes ou no estado do Gateway do guest.
  - A prova pós-atualização executa a superfície normal dos plugins incluídos porque
    fachadas de capacidade como fala, geração de imagem e entendimento de mídia
    são carregadas por APIs de runtime incluídas mesmo quando a própria interação
    do agente verifica apenas uma resposta simples em texto.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local do provedor AIMock para testes smoke diretos de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane de QA ao vivo do Matrix contra um homeserver Tuwunel descartável apoiado por Docker. Somente checkout do código-fonte — instalações empacotadas não incluem `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, variáveis de ambiente e layout de artefatos: [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a lane de QA ao vivo do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do ambiente.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Aceita `--credential-source convex` para credenciais compartilhadas em pool. Use o modo por ambiente por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável entre bots, habilite o Modo de Comunicação Bot-to-Bot no `@BotFather` para ambos os bots e garanta que o bot driver consiga observar o tráfego de bots do grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários de resposta incluem RTT desde a solicitação de envio do driver até a resposta observada do SUT.

Lanes de transporte ao vivo compartilham um contrato padrão para que novos transportes não desviem; a matriz de cobertura por lane fica em [Visão geral de QA → Cobertura de transporte ao vivo](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` é a suíte sintética ampla e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o laboratório de QA adquire um lease exclusivo de um pool apoiado por Convex, envia heartbeats
desse lease enquanto a lane está em execução e libera o lease no encerramento.

Scaffold de referência do projeto Convex:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção da função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão do ambiente: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por padrão em CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` em loopback para desenvolvimento somente local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar do pool) exigem
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Auxiliares de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções ao vivo para verificar a URL do site Convex, segredos do broker,
prefixo do endpoint, timeout HTTP e acessibilidade de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e utilitários
de CI.

Contrato padrão de endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitação: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/repetível: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /release`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /admin/add` (somente segredo de mantenedor)
  - Solicitação: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (somente segredo de mantenedor)
  - Solicitação: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Solicitação: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato de payload para tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string de id numérico de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um canal ao QA

A arquitetura e os nomes dos auxiliares de cenário para novos adaptadores de canal ficam em [Visão geral de QA → Adicionando um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel). O requisito mínimo: implementar o executor de transporte no seam de host compartilhado `qa-lab`, declarar `qaRunners` no manifesto do Plugin, montar como `openclaw qa <runner>` e criar cenários em `qa/scenarios/`.

## Suítes de teste (o que executa onde)

Pense nas suítes como “realismo crescente” (e instabilidade/custo crescentes):

### Unidade / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções não direcionadas usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards multiprojeto em configurações por projeto para agendamento paralelo
- Arquivos: inventários de core/unidade em `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; testes unitários de UI executam no shard dedicado `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração no processo (autenticação do Gateway, roteamento, tooling, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Executa em CI
  - Não exige chaves reais
  - Deve ser rápido e estável
  - Testes de resolvedor e loader de superfície pública devem provar o comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com fixtures minúsculas geradas de Plugin, não
    APIs de código-fonte reais de Plugin incluído. Loads reais de API de Plugin pertencem às
    suítes de contrato/integração pertencentes ao Plugin.

<AccordionGroup>
  <Accordion title="Projetos, shards e lanes com escopo">

    - `pnpm test` sem alvo executa doze configurações de shard menores (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo nativo gigante do projeto raiz. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensão prive suites não relacionadas de recursos.
    - `pnpm test --watch` ainda usa o grafo de projeto raiz nativo de `vitest.config.ts`, porque um loop de observação com múltiplos shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo completo de inicialização do projeto raiz.
    - `pnpm test:changed` expande caminhos git alterados para lanes baratos com escopo por padrão: edições diretas em testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de origem e dependentes do grafo de importação local. Edições de config/setup/package não executam testes amplos, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é o gate normal de verificação local inteligente para trabalho restrito. Ele classifica o diff em core, testes de core, extensões, testes de extensão, apps, docs, metadados de release, tooling live de Docker e tooling, e então executa os comandos correspondentes de typecheck, lint e guard. Ele não executa testes Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explícito para comprovação por teste. Aumentos de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependência raiz, com um guard que rejeita alterações de package fora do campo de versão de nível superior.
    - Edições do harness live Docker ACP executam verificações focadas: sintaxe de shell para os scripts live Docker de autenticação e um dry-run do scheduler live Docker. Alterações em `package.json` são incluídas apenas quando o diff se limita a `scripts["test:docker:live-*"]`; edições de dependência, export, versão e outras superfícies de package ainda usam os guards mais amplos.
    - Testes unitários leves de importação de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas semelhantes de utilitários puros passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com muito estado/runtime permanecem nas lanes existentes.
    - Arquivos de origem auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, então edições de helpers evitam reexecutar a suite pesada completa desse diretório.
    - `auto-reply` tem buckets dedicados para helpers de core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. A CI divide ainda mais a subárvore reply em shards de agent-runner, dispatch e commands/state-routing para que um bucket pesado em importações não retenha toda a cauda do Node.
    - A CI normal de PR/main ignora intencionalmente a varredura em lote de extensões e o shard apenas de release `agentic-plugins`. A Full Release Validation dispara o workflow filho separado `Plugin Prerelease` para essas suites pesadas em plugins/extensões em candidatos a release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Quando você alterar entradas de descoberta de message-tool ou contexto de
      runtime de compaction, mantenha os dois níveis de cobertura.
    - Adicione regressões focadas de helpers para limites puros de roteamento e
      normalização.
    - Mantenha saudáveis as suites de integração do runner incorporado:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suites verificam que ids com escopo e comportamento de compaction
      ainda fluem pelos caminhos reais de `run.ts` / `compact.ts`; testes apenas
      de helpers não são um substituto suficiente para esses caminhos de integração.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
      runner não isolado nos projetos raiz, configurações e2e e live.
    - A lane raiz de UI mantém seu setup e otimizador `jsdom`, mas também executa
      no runner compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false`
      da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão para processos
      Node filhos do Vitest para reduzir churn de compilação do V8 durante grandes
      execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com
      o comportamento padrão do V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit é apenas para formatação. Ele reestageia arquivos formatados e
      não executa lint, typecheck ou testes.
    - Execute `pnpm check:changed` explicitamente antes do handoff ou push quando
      precisar do gate de verificação local inteligente.
    - `pnpm test:changed` roteia por lanes baratos com escopo por padrão. Use
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` apenas quando o agent
      decidir que uma edição de harness, config, package ou contrato realmente precisa
      de cobertura Vitest mais ampla.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de
      roteamento, apenas com um limite maior de workers.
    - O dimensionamento automático de workers locais é intencionalmente conservador e recua
      quando a média de carga do host já está alta, então múltiplas execuções
      concorrentes de Vitest causam menos impacto por padrão.
    - A configuração base do Vitest marca os projetos/arquivos de configuração como
      `forceRerunTriggers` para que reexecuções em modo changed permaneçam corretas quando
      a fiação de testes muda.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts
      compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se você quiser
      um local de cache explícito para profiling direto.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` habilita o relatório de duração de importação do Vitest, além
      da saída de detalhamento de importações.
    - `pnpm test:perf:imports:changed` restringe a mesma visão de profiling a
      arquivos alterados desde `origin/main`.
    - Dados de temporização de shards são gravados em `.artifacts/vitest-shard-timings.json`.
      Execuções de configuração inteira usam o caminho da configuração como chave; shards de CI
      com padrão de inclusão acrescentam o nome do shard para que shards filtrados possam ser rastreados
      separadamente.
    - Quando um teste quente ainda passa a maior parte do tempo em importações de inicialização,
      mantenha dependências pesadas atrás de uma seam local estreita `*.runtime.ts` e
      faça mock dessa seam diretamente em vez de fazer deep-import de helpers de runtime apenas
      para passá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
      `test:changed` roteado com o caminho nativo do projeto raiz para aquele diff commitado
      e imprime o tempo de relógio, além do RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mede a árvore suja atual
      roteando a lista de arquivos alterados por
      `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
      overhead de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a
      suite unitária com paralelismo de arquivos desabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidade (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada para um worker
- Escopo:
  - Inicia um Gateway real em loopback com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagens de gateway, memória e payloads grandes pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` via RPC WS do Gateway
  - Cobre helpers de persistência do bundle de estabilidade de diagnóstico
  - Asserta que o recorder permanece limitado, amostras sintéticas de RSS ficam abaixo do orçamento de pressão e profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane restrita para acompanhamento de regressão de estabilidade, não um substituto para a suite completa do Gateway

### E2E (smoke de gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins incluídos em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, combinando com o restante do repo.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir overhead de E/S no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end de gateway multi-instância
  - Superfícies WebSocket/HTTP, pareamento de nodes e networking mais pesado
- Expectativas:
  - Executa em CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria uma sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw por `sandbox ssh-config` real + execução SSH
  - Verifica o comportamento de filesystem canônico remoto pela ponte fs da sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local, além de um daemon Docker funcionando
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e então destrói o gateway e a sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suite e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário de CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de plugins incluídos em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Capturar alterações de formato de provedor, peculiaridades de tool-calling, problemas de autenticação e comportamento de rate limit
- Expectativas:
  - Não é estável para CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa rate limits
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live fazem source de `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para uma home temporária de teste, para que fixtures unitárias não possam alterar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você precisar intencionalmente que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/ruído Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de rate limit.
- Saída de progresso/heartbeat:
  - Suites live agora emitem linhas de progresso para stderr, para que chamadas longas de provedores fiquem visivelmente ativas mesmo quando a captura de console do Vitest estiver silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suite devo executar?

Use esta tabela de decisão:

- Lógica/testes de edição: execute `pnpm test` (e `pnpm test:coverage` se você alterou muita coisa)
- Alterações na rede do Gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depuração de “meu bot está fora do ar” / falhas específicas de provedor / chamadas de ferramentas: execute um `pnpm test:live` mais restrito

## Testes live (que acessam a rede)

Para a matriz de modelos live, smokes do backend da CLI, smokes de ACP, harness do servidor de app Codex e todos os testes live de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem, música, vídeo, harness de mídia) — além do tratamento de credenciais para execuções live — consulte [Testes — suítes live](/pt-BR/help/testing-live).

## Executores Docker (verificações opcionais de "funciona no Linux")

Esses executores Docker se dividem em dois grupos:

- Executores de modelos live: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live de chave de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório de configuração local e workspace (e carregando `~/.profile` se estiver montado). Os pontos de entrada locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os executores live do Docker usam por padrão um limite de smoke menor para que uma varredura completa do Docker continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescreva essas variáveis de ambiente quando você
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` compila a imagem Docker live uma vez via `test:docker:live-build`, empacota o OpenClaw uma vez como um tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e então compila/reutiliza duas imagens `scripts/e2e/Dockerfile`. A imagem básica é apenas o executor Node/Git para faixas de instalação/atualização/dependência de Plugin; essas faixas montam o tarball pré-compilado. A imagem funcional instala o mesmo tarball em `/app` para faixas de funcionalidade do app compilado. As definições das faixas Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregado usa um agendador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla os slots de processo, enquanto limites de recursos impedem que faixas live pesadas, de instalação npm e de múltiplos serviços iniciem todas ao mesmo tempo. Se uma única faixa for mais pesada que os limites ativos, o agendador ainda poderá iniciá-la quando o pool estiver vazio e então mantê-la executando sozinha até que haja capacidade novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` apenas quando o host Docker tiver mais folga. O executor faz um preflight do Docker por padrão, remove contêineres E2E antigos do OpenClaw, imprime o status a cada 30 segundos, armazena tempos de faixas bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar primeiro as faixas mais longas em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado de faixas sem compilar nem executar o Docker, ou `node scripts/test-docker-all.mjs --plan-json` para imprimir o plano de CI para as faixas selecionadas, necessidades de pacote/imagem e credenciais.
- `Package Acceptance` é o gate de pacote nativo do GitHub para "este tarball instalável funciona como um produto?" Ele resolve um pacote candidato a partir de `source=npm`, `source=ref`, `source=url` ou `source=artifact`, envia-o como `package-under-test` e então executa as faixas E2E Docker reutilizáveis contra esse tarball exato em vez de reempacotar a ref selecionada. `workflow_ref` seleciona os scripts confiáveis de workflow/harness, enquanto `package_ref` seleciona o commit/branch/tag de origem a empacotar quando `source=ref`; isso permite que a lógica de aceitação atual valide commits confiáveis mais antigos. Os perfis são ordenados por abrangência: `smoke` é instalação/canal/agente rápida mais Gateway/configuração, `package` é o contrato de pacote/atualização/Plugin e a substituição nativa padrão para a maior parte da cobertura de pacote/atualização do Parallels, `product` adiciona canais MCP, limpeza de Cron/subagente, pesquisa web da OpenAI e OpenWebUI, e `full` executa os blocos Docker do caminho de release com OpenWebUI. A validação de release executa um delta de pacote personalizado (`bundled-channel-deps-compat plugins-offline`) mais QA de pacote do Telegram porque os blocos Docker do caminho de release já cobrem as faixas sobrepostas de pacote/atualização/Plugin. Comandos direcionados de reexecução Docker no GitHub gerados a partir de artefatos incluem, quando disponíveis, entradas do artefato de pacote anterior e imagens preparadas, para que faixas com falha possam evitar recompilar o pacote e as imagens.
- Verificações de build e release executam `scripts/check-cli-bootstrap-imports.mjs` depois do tsdown. O guard percorre o grafo estático compilado a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se a inicialização pré-dispatch importar dependências de pacote como Commander, UI de prompt, undici ou logging antes do dispatch do comando; ele também mantém o bloco bundled de execução do Gateway dentro do orçamento e rejeita imports estáticos de caminhos frios conhecidos do Gateway. O smoke da CLI empacotada também cobre ajuda raiz, ajuda de onboarding, ajuda do doctor, status, esquema de configuração e um comando de listagem de modelos.
- A compatibilidade legada do Package Acceptance é limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse corte, o harness tolera apenas lacunas de metadados de pacotes já enviados: entradas omitidas de inventário QA privado, ausência de `gateway install --wrapper`, ausência de arquivos de patch na fixture git derivada do tarball, ausência de `update.channel` persistido, locais legados de registros de instalação de Plugin, ausência de persistência de registros de instalação do marketplace e migração de metadados de configuração durante `plugins update`. Para pacotes posteriores a `2026.4.25`, esses caminhos são falhas estritas.
- Executores de smoke em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` iniciam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os executores Docker de modelos live também fazem bind mount apenas dos diretórios home de autenticação da CLI necessários (ou todos os compatíveis quando a execução não é restrita), e então os copiam para o diretório home do contêiner antes da execução para que o OAuth de CLI externa possa renovar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Teste de fumaça de vinculação ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Teste de fumaça do backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Teste de fumaça do arcabouço do servidor de aplicativo Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Teste de fumaça de observabilidade: `pnpm qa:otel:smoke` é uma faixa privada de verificação de checkout de origem da QA. Ele intencionalmente não faz parte das faixas de lançamento Docker de pacote porque o tarball npm omite o QA Lab.
- Teste de fumaça ao vivo do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de integração inicial (TTY, estrutura completa): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Teste de fumaça de integração inicial/canal/agente com tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente no Docker o tarball empacotado do OpenClaw, configura OpenAI via integração inicial com referência de ambiente e Telegram por padrão, verifica se o doctor reparou dependências ativadas de runtime de Plugin e executa um turno simulado de agente OpenAI. Reutilize um tarball pré-criado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a reconstrução no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Teste de fumaça de troca de canal de atualização: `pnpm test:docker:update-channel-switch` instala globalmente no Docker o tarball empacotado do OpenClaw, muda de pacote `stable` para git `dev`, verifica o canal persistido e o funcionamento pós-atualização do Plugin, depois volta para o pacote `stable` e verifica o status de atualização.
- Teste de fumaça do contexto de runtime da sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta da transcrição do contexto de runtime mais o reparo pelo doctor dos ramos duplicados afetados de reescrita de prompt.
- Teste de fumaça de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala com `bun install -g` em uma home isolada e verifica se `openclaw infer image providers --json` retorna provedores de imagem agrupados em vez de travar. Reutilize um tarball pré-criado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a compilação no host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Teste de fumaça Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um cache npm entre seus contêineres root, update e direct-npm. O teste de fumaça de atualização usa por padrão o npm `latest` como baseline estável antes de atualizar para o tarball candidato. Substitua com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente ou com a entrada `update_baseline_version` do fluxo de trabalho Install Smoke no GitHub. As verificações do instalador sem root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em novas execuções locais.
- O CI Install Smoke pula a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa variável de ambiente quando a cobertura direta de `npm install -g` for necessária.
- Teste de fumaça da CLI para exclusão de workspace compartilhado por agentes: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) cria a imagem do Dockerfile raiz por padrão, semeia dois agentes com um workspace em uma home isolada de contêiner, executa `agents delete --json` e verifica JSON válido mais o comportamento de workspace retido. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois contêineres, autenticação WS + integridade): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Teste de fumaça de snapshot CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) cria a imagem E2E de origem mais uma camada Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica se os snapshots de função CDP cobrem URLs de links, clicáveis promovidos pelo cursor, refs de iframe e metadados de frame.
- Regressão de raciocínio mínimo do OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado por meio do Gateway, verifica se `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do esquema pelo provedor e confere se o detalhe bruto aparece nos logs do Gateway.
- Ponte de canal MCP (Gateway semeado + ponte stdio + teste de fumaça de frame de notificação bruto do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote Pi (servidor MCP stdio real + teste de fumaça de permitir/negar do perfil Pi embutido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + encerramento de filho MCP stdio após execuções isoladas de cron e de subagente pontual): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (teste de fumaça de instalação, instalação/desinstalação kitchen-sink do ClawHub, atualizações de marketplace e habilitação/inspeção de pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para pular o bloco ClawHub ou substitua o par padrão de pacote/runtime kitchen-sink com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor de fixture ClawHub local hermético.
- Teste de fumaça de atualização de Plugin sem alteração: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Teste de fumaça de metadados de recarregamento de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependências de runtime de Plugin agrupado: `pnpm test:docker:bundled-channel-deps` cria uma pequena imagem executora Docker por padrão, compila e empacota o OpenClaw uma vez no host e então monta esse tarball em cada cenário de instalação Linux. Reutilize a imagem com `OPENCLAW_SKIP_DOCKER_BUILD=1`, pule a reconstrução no host depois de uma compilação local recente com `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ou aponte para um tarball existente com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. O agregado Docker completo e os fragmentos bundled-channel do caminho de lançamento pré-empacotam esse tarball uma vez, depois fragmentam as verificações de canais agrupados em faixas independentes, incluindo faixas de atualização separadas para Telegram, Discord, Slack, Feishu, memory-lancedb e ACPX. Os fragmentos de lançamento dividem testes de fumaça de canais, destinos de atualização e contratos de setup/runtime em `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` e `bundled-channels-contracts`; o fragmento agregado `bundled-channels` permanece disponível para reexecuções manuais. O fluxo de trabalho de lançamento também divide fragmentos do instalador de provedor e fragmentos de instalação/desinstalação de Plugin agrupado; os fragmentos legados `package-update`, `plugins-runtime` e `plugins-integrations` permanecem como aliases agregados para reexecuções manuais. Use `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` para restringir a matriz de canais ao executar a faixa agrupada diretamente ou `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` para restringir o cenário de atualização. Execuções Docker por cenário usam por padrão `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; o cenário de atualização com vários destinos usa por padrão `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. A faixa também verifica que `channels.<id>.enabled=false` e `plugins.entries.<id>.enabled=false` suprimem o reparo pelo doctor/dependência de runtime.
- Restrinja as dependências de runtime de Plugin agrupado durante a iteração desabilitando cenários não relacionados, por exemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para pré-criar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts a baixam se ela ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam o comportamento de pacote/instalação, não o runtime de aplicativo compilado compartilhado.

Os executores Docker de modelo ao vivo também montam o checkout atual como somente leitura e
o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a imagem
de runtime enxuta enquanto ainda executa o Vitest contra sua origem/configuração local exata.
A etapa de preparação pula caches grandes apenas locais e saídas de compilação de aplicativos, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios de saída `.build` locais do aplicativo ou
do Gradle, para que execuções Docker ao vivo não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas ao vivo do gateway não iniciem
trabalhadores reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura ao vivo do gateway
dessa faixa Docker.
`test:docker:openwebui` é um teste de fumaça de compatibilidade de nível mais alto: ele inicia um
contêiner de gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner Open WebUI fixado contra esse gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser sensivelmente mais lenta porque o Docker pode precisar baixar a
imagem Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de inicialização fria.
Esta faixa espera uma chave de modelo ao vivo utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções conteinerizadas.
Execuções bem-sucedidas imprimem uma pequena carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway
semeado, inicia um segundo contêiner que gera `openclaw mcp serve` e então
verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexos,
comportamento de fila de eventos ao vivo, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos para que o teste de fumaça valide o que a
ponte realmente emite, não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo ao vivo.
Ele cria a imagem Docker do repositório, inicia um servidor de sondagem MCP stdio real
dentro do contêiner, materializa esse servidor pelo runtime MCP do pacote Pi embutido,
executa a ferramenta e então verifica se `coding` e `messaging` mantêm
ferramentas `bundle-mcp` enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo ao vivo.
Ele inicia um Gateway semeado com um servidor de sondagem MCP stdio real, executa um
turno isolado de cron e um turno filho pontual de `/subagents spawn` e então verifica
se o processo filho MCP encerra após cada execução.

Teste de fumaça manual de thread ACP em linguagem natural (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de trabalho de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de threads ACP, portanto não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/workspace e sem montagens externas de autenticação da CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações da CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação da CLI em `$HOME` são montados como somente leitura em `/host-auth...` e então copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas de provider montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar providers dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em novas execuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfil (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo Gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Sanidade da documentação

Execute verificações da documentação após edições em docs: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar de verificações de títulos dentro da página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem providers reais:

- Chamada de ferramenta do Gateway (OpenAI simulado, gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "executa uma chamada de ferramenta OpenAI simulada de ponta a ponta via loop de agente do gateway")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "executa o assistente por ws e grava a configuração do token de autenticação")

## Avaliações de confiabilidade de agentes (skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade de agentes”:

- Chamada de ferramentas simulada pelo Gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos de assistente de ponta a ponta que validam a conexão da sessão e os efeitos da configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/argumentos obrigatórios?
- **Contratos de fluxo de trabalho:** cenários de múltiplos turnos que verificam a ordem das ferramentas, a transferência do histórico da sessão e os limites do sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um executor de cenários usando providers simulados para verificar chamadas de ferramenta + ordem, leituras de arquivos de skill e conexão da sessão.
- Uma pequena suíte de cenários focados em skills (usar vs. evitar, gating, injeção de prompt).
- Avaliações live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver implementada.

## Testes de contrato (formato de plugin e canal)

Testes de contrato verificam que todo plugin e canal registrado está em conformidade com seu contrato de interface. Eles iteram por todos os plugins descobertos e executam uma suíte de asserções de formato e comportamento. A lane unitária padrão de `pnpm test` ignora intencionalmente esses arquivos compartilhados de smoke e seam; execute os comandos de contrato explicitamente quando tocar em superfícies compartilhadas de canal ou provider.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Somente contratos de canal: `pnpm test:contracts:channels`
- Somente contratos de provider: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagens recebidas
- **actions** - Handlers de ação de canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provider

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondagens de status de canal
- **registry** - Formato do registro de plugins

### Contratos de provider

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugins
- **loader** - Carregamento de plugins
- **runtime** - Runtime de provider
- **shape** - Formato/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exports ou subpaths de plugin-sdk
- Após adicionar ou modificar um canal ou plugin de provider
- Após refatorar registro ou descoberta de plugins

Testes de contrato rodam na CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Ao corrigir um problema de provider/modelo descoberto em live:

- Adicione uma regressão segura para CI se possível (provider simulado/stub ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in via variáveis de ambiente
- Prefira mirar na menor camada que captura o bug:
  - bug de conversão/reprodução de requisição do provider → teste direto de modelos
  - bug no pipeline de sessão/histórico/ferramentas do gateway → smoke live do gateway ou teste mock de gateway seguro para CI
- Guardrail de travessia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), então verifica que ids de execução com segmentos de travessia são rejeitados.
  - Se você adicionar uma nova família de alvos SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testes live](/pt-BR/help/testing-live)
- [CI](/pt-BR/ci)
