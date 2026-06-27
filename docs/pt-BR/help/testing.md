---
read_when:
    - Executando testes localmente ou no CI
    - Adicionando regressões para bugs de modelo/provedor
    - Depuração do comportamento do Gateway + agente
summary: 'Kit de testes: suítes unitárias/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-06-27T17:36:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

O OpenClaw tem três suítes Vitest (unitária/integração, e2e, live) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração).
- Como os testes live descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelo/provedor.

<Note>
**A pilha de QA (qa-lab, qa-channel, vias de transporte live)** é documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) - arquitetura, superfície de comandos, autoria de cenários.
- [QA de matriz](/pt-BR/concepts/qa-matrix) - referência para `pnpm openclaw qa matrix`.
- [Cartão de pontuação de maturidade](/pt-BR/maturity/scorecard) - como as evidências de QA de release dão suporte a decisões de estabilidade e LTS.
- [Canal de QA](/pt-BR/channels/qa-channel) - o Plugin de transporte sintético usado por cenários respaldados pelo repositório.

Esta página cobre a execução das suítes de teste regulares e dos executores Docker/Parallels. A seção de executores específicos de QA abaixo ([executores específicos de QA](#qa-specific-runners)) lista as invocações `qa` concretas e aponta de volta para as referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina espaçosa: `pnpm test:max`
- Loop direto de observação do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivo agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando em uma única falha.
- Site de QA respaldado por Docker: `pnpm qa:lab:up`
- Via de QA respaldada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você tocar em testes ou quiser confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

## Diretórios Temporários de Teste

Prefira os helpers compartilhados em `test/helpers/temp-dir.ts` para diretórios
temporários pertencentes aos testes. Eles tornam a propriedade explícita e mantêm a limpeza no mesmo
ciclo de vida do teste:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

Use `makeTempDir(tempDirs, prefix)` e `cleanupTempDirs(tempDirs)` quando um teste
já possuir um array ou conjunto de caminhos. Evite novas chamadas diretas a `fs.mkdtemp*` em
testes, a menos que um caso esteja verificando explicitamente o comportamento bruto de diretório temporário. Adicione um
comentário de permissão auditável com um motivo concreto quando um teste precisar intencionalmente de um
diretório temporário direto:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Para visibilidade de migração, `node scripts/report-test-temp-creations.mjs` relata
novas criações diretas de diretórios temporários em linhas adicionadas no diff sem bloquear estilos de limpeza
existentes. Seu escopo de arquivo segue intencionalmente a mesma classificação de caminhos de teste
usada por `scripts/changed-lanes.mjs`, em vez de manter uma heurística separada de nome de arquivo
de helper de teste, enquanto ignora a própria implementação do helper compartilhado.
`check:changed` executa este relatório para caminhos de teste alterados como um sinal de CI
somente de aviso; achados são anotações de aviso do GitHub, não falhas.

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcionar um arquivo live silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Relatórios de desempenho em tempo de execução: dispare `OpenClaw Performance` com
  `live_openai_candidate=true` para um turno real de agente `openai/gpt-5.5` ou
  `deep_profile=true` para artefatos de CPU/heap/trace do Kova. Execuções agendadas diárias
  publicam artefatos das vias mock-provider, deep-profile e GPT 5.5 em
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` está configurado. O
  relatório mock-provider também inclui inicialização do gateway em nível de fonte, memória,
  pressão de Plugin, loop repetido de saudação com modelo falso e números de inicialização da CLI.
- Varredura de modelo live em Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa um turno de texto mais uma pequena sonda no estilo de leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam um pequeno turno de imagem.
    Desabilite as sondas extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diário e
    `OpenClaw Release Checks` manual chamam o workflow live/E2E reutilizável com
    `include_live_suites: true`, que inclui jobs de matriz de modelo live Docker separados
    particionados por provedor.
  - Para reexecuções focadas de CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke nativo de chat vinculado do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma via live em Docker contra o caminho do servidor de aplicativo do Codex, vincula uma DM sintética do
    Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, então verifica uma resposta simples e um anexo de imagem
    roteados pela vinculação nativa do Plugin em vez de ACP.
- Smoke do harness do servidor de aplicativo do Codex: `pnpm test:docker:live-codex-harness`
  - Executa turnos de agente do gateway pelo harness do servidor de aplicativo do Codex pertencente ao Plugin,
    verifica `/codex status` e `/codex models`, e por padrão exercita sondas de imagem,
    MCP de Cron, subagente e Guardian. Desabilite a sonda de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do servidor de aplicativo
    do Codex. Para uma verificação focada de subagente, desabilite as outras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isto sai após a sonda de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke de instalação sob demanda do Codex: `pnpm test:docker:codex-on-demand`
  - Instala o tarball empacotado do OpenClaw no Docker, executa o onboarding com chave de API
    da OpenAI e verifica que o Plugin Codex e a dependência `@openai/codex`
    foram baixados sob demanda para a raiz do projeto npm gerenciado.
- Smoke live de dependência de ferramenta de Plugin: `pnpm test:docker:live-plugin-tool`
  - Empacota um Plugin de fixture com uma dependência real `slugify`, instala-o via
    `npm-pack:`, verifica a dependência sob a raiz do projeto npm gerenciado,
    então pede a um modelo live da OpenAI para chamar a ferramenta do Plugin e retornar o slug
    oculto.
- Smoke do comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional de redundância para a superfície de comando de resgate do canal de mensagens.
    Ela exercita `/crestodian status`, enfileira uma mudança persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de escrita de auditoria/configuração.
- Smoke Docker do planejador Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem configuração com uma CLI Claude falsa no `PATH`
    e verifica que o fallback do planejador fuzzy é traduzido em uma escrita tipada de configuração
    auditada.
- Smoke Docker de primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa a partir de um diretório de estado vazio do OpenClaw, verifica o entrypoint moderno de onboarding
    do Crestodian, aplica escritas de setup/modelo/agente/Plugin Discord + SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de setup Ring 0
    também é coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, então execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON relata Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você precisa de apenas um caso que falha, prefira restringir os testes live por meio das variáveis de ambiente de lista de permissão descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das suítes de teste principais quando você precisa de realismo do QA-lab:

O CI executa QA Lab em workflows dedicados. A paridade agêntica fica aninhada sob
`QA-Lab - All Lanes` e validação de release, não como um workflow de PR independente.
Validação ampla deve usar `Full Release Validation` com
`rerun_group=qa-parity` ou o grupo de QA de release-checks. Verificações de release
estáveis/padrão mantêm o soak live/Docker exaustivo atrás de `run_release_soak=true`; o
perfil `full` força o soak. `QA-Lab - All Lanes`
executa todas as noites em `main` e por disparo manual com a via de paridade mock, via live
Matrix, via live Telegram gerenciada pelo Convex e via live Discord gerenciada pelo Convex
como jobs paralelos. QA agendado e verificações de release passam Matrix
`--profile fast` explicitamente, enquanto a CLI Matrix e a entrada manual do workflow
continuam com o padrão `all`; o disparo manual pode particionar `all` em jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` executa paridade mais as vias rápidas Matrix e Telegram antes da aprovação de release,
usando `mock-openai/gpt-5.5` para verificações de transporte de release, para que permaneçam
determinísticas e evitem a inicialização normal de Plugin de provedor. Esses gateways de transporte live
desabilitam busca de memória; o comportamento de memória continua coberto pelas suítes de paridade
de QA.

Os shards live de mídia de release completo usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já tem
`ffmpeg` e `ffprobe`. Shards Docker live de modelo/backend usam a imagem compartilhada
`ghcr.io/openclaw/openclaw-live-test:<sha>` criada uma vez por commit
selecionado, então a puxam com `OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de reconstruir
dentro de cada shard.

- `pnpm openclaw qa suite`
  - Executa cenários de QA baseados no repositório diretamente no host.
  - Grava artefatos de nível superior `qa-evidence.json`, `qa-suite-summary.json` e
    `qa-suite-report.md` para o conjunto de cenários selecionado, incluindo
    seleções de cenários de fluxo misto, Vitest e Playwright.
  - Quando disparado por `pnpm openclaw qa run --qa-profile <profile>`, incorpora o
    scorecard do perfil de taxonomia selecionado no mesmo `qa-evidence.json`.
    `smoke-ci` grava evidências reduzidas, o que define `evidenceMode: "slim"` e omite
    `execution` por entrada. `release` cobre o recorte curado de prontidão para lançamento;
    `all` seleciona todas as categorias de maturidade ativas e é destinado a disparos explícitos do fluxo de trabalho
    Evidência de Perfil de QA quando um artefato de scorecard completo é
    necessário.
  - Executa vários cenários selecionados em paralelo por padrão com workers de
    Gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a
    contagem de workers, ou `--concurrency 1` para a faixa serial antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Dá suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local baseado em AIMock para cobertura
    experimental de fixtures e mocks de protocolo sem substituir a faixa
    `mock-openai` ciente de cenários.
- `pnpm openclaw qa coverage --match <query>`
  - Pesquisa IDs de cenário, títulos, superfícies, IDs de cobertura, refs de docs, refs de código,
    plugins e requisitos de provedor, depois imprime os alvos de suíte correspondentes.
  - Use isto antes de uma execução do QA Lab quando você conhece o comportamento ou caminho de arquivo tocado,
    mas não o menor cenário. É apenas consultivo; ainda escolha prova mock,
    live, Multipass, Matrix ou de transporte com base no comportamento que está sendo alterado.
- `pnpm test:plugins:kitchen-sink-live`
  - Executa a bateria live do plugin OpenAI Kitchen Sink pelo QA Lab. Ela
    instala o pacote externo Kitchen Sink, verifica o inventário da superfície do SDK de plugin,
    sonda `/healthz` e `/readyz`, registra evidências de CPU/RSS do Gateway,
    executa um turno live da OpenAI e verifica diagnósticos adversariais.
    Requer autenticação live da OpenAI, como `OPENAI_API_KEY`. Em sessões Testbox
    hidratadas, ela carrega automaticamente o perfil de autenticação live do Testbox quando o helper
    `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o bench de inicialização do Gateway mais um pequeno pacote de cenários mock do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado de observação de CPU
    em `.artifacts/gateway-cpu-scenarios/`.
  - Sinaliza por padrão apenas observações sustentadas de CPU alta (`--cpu-core-warn`
    mais `--hot-wall-warn-ms`), então rajadas curtas de inicialização são registradas como métricas
    sem parecerem a regressão de Gateway preso por minutos.
  - Usa artefatos `dist` compilados; execute uma build primeiro quando o checkout ainda não
    tiver saída de runtime recente.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários de `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo de `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA compatíveis que são práticas para o convidado:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o convidado possa gravar de volta pelo
    workspace montado.
  - Grava o relatório + resumo normais de QA, além de logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA baseado em Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Cria um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo com chave de API da OpenAI, configura Telegram
    por padrão, verifica que o runtime de plugin empacotado carrega sem reparo
    de dependência na inicialização, executa doctor e executa um turno de agente local contra um
    endpoint OpenAI mockado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma faixa de instalação empacotada
    com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke Docker determinístico do app compilado para transcrições de contexto de runtime
    incorporado. Ele verifica que o contexto oculto de runtime do OpenClaw é persistido como uma
    mensagem personalizada sem exibição em vez de vazar para o turno visível do usuário,
    depois semeia um JSONL de sessão quebrada afetada e verifica que
    `openclaw doctor --fix` o regrava para a branch ativa com um backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um candidato de pacote OpenClaw no Docker, executa onboarding de pacote instalado,
    configura Telegram pela CLI instalada, depois reutiliza a faixa de QA live do Telegram
    com esse pacote instalado como o Gateway SUT.
  - O wrapper monta apenas o código-fonte do harness `qa-lab` a partir do checkout; o
    pacote instalado possui `dist`, `openclaw/plugin-sdk` e o runtime de plugin
    empacotado, para que a faixa não misture plugins do checkout atual no pacote
    em teste.
  - O padrão é `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez de
    instalar pelo registro.
  - Emite temporização RTT repetida em `qa-evidence.json` por padrão com
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sobrescreva
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar a execução RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` aceita uma lista separada por vírgulas de
    IDs de verificação de QA do Telegram para amostrar; quando indefinido, a verificação padrão compatível com RTT
    é `telegram-mentioned-message-reply`.
  - Usa as mesmas credenciais env do Telegram ou fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/lançamento, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - O wrapper valida o env de credenciais do Telegram ou Convex no host antes do trabalho de
    build/install do Docker. Defina `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    apenas ao depurar deliberadamente a configuração pré-credencial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescreve o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta faixa. Quando credenciais Convex
    são selecionadas e nenhuma função é definida, o wrapper usa `ci` no CI e
    `maintainer` fora do CI.
  - GitHub Actions expõe esta faixa como o fluxo de trabalho manual de mantenedor
    `NPM Telegram Beta E2E`. Ela não é executada em merge. O fluxo de trabalho usa o
    ambiente `qa-live-shared` e leases de credenciais CI do Convex.
- GitHub Actions também expõe `Package Acceptance` para prova de produto em execução lateral
  contra um pacote candidato. Ele aceita uma ref confiável, especificação npm publicada,
  URL HTTPS de tarball mais SHA-256, ou artefato de tarball de outra execução, envia
  o `openclaw-current.tgz` normalizado como `package-under-test`, depois executa o
  agendador Docker E2E existente com perfis de faixa smoke, pacote, produto, completo ou personalizado.
  Defina `telegram_mode=mock-openai` ou `live-frontier` para executar o fluxo de trabalho de QA do
  Telegram contra o mesmo artefato `package-under-test`.
  - Prova de produto da beta mais recente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Prova de URL exata de tarball exige um digest e usa a política de segurança de URL pública:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Espelhos de tarball corporativos/privados usam uma política explícita de fonte confiável:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lê `.github/package-trusted-sources.json` da ref de fluxo de trabalho confiável e não aceita credenciais de URL nem um bypass de rede privada por entrada de fluxo de trabalho. Se a política nomeada declarar autenticação bearer, configure o segredo fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- A prova por artefato baixa um artefato de tarball de outra execução do Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empacota e instala a build atual do OpenClaw no Docker, inicia o Gateway
    com OpenAI configurada, depois habilita canais/plugins empacotados por meio de edições de config.
  - Verifica que a descoberta de setup deixa plugins baixáveis não configurados ausentes,
    que o primeiro reparo doctor configurado instala explicitamente cada plugin baixável
    ausente, e que uma segunda reinicialização não executa reparo oculto de
    dependências.
  - Também instala uma baseline npm mais antiga conhecida, habilita Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica que o doctor pós-atualização
    do candidato limpa resíduos legados de dependências de plugin sem um reparo postinstall
    do lado do harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke nativo de atualização de instalação empacotada entre convidados Parallels. Cada
    plataforma selecionada primeiro instala o pacote baseline solicitado, depois executa o
    comando `openclaw update` instalado no mesmo convidado e verifica a
    versão instalada, o status de atualização, a prontidão do Gateway e um turno de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` ao
    iterar em um convidado. Use `--json` para o caminho do artefato de resumo e
    o status por faixa.
  - A faixa OpenAI usa `openai/gpt-5.5` para a prova live de turno de agente por
    padrão. Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ao validar deliberadamente outro
    modelo OpenAI.
  - Envolva execuções locais longas em um timeout do host para que travamentos de transporte do Parallels não
    consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs de faixa aninhados em `/tmp/openclaw-parallels-npm-update.*`.
    Inspecione `windows-update.log`, `macos-update.log` ou `linux-update.log`
    antes de assumir que o wrapper externo travou.
  - A atualização do Windows pode passar de 10 a 15 minutos no doctor pós-atualização e no trabalho de
    atualização de pacote em um convidado frio; isso ainda é saudável quando o log de depuração npm
    aninhado está avançando.
  - Não execute este wrapper agregado em paralelo com faixas individuais de smoke do Parallels
    macOS, Windows ou Linux. Elas compartilham estado de VM e podem colidir na
    restauração de snapshot, no serviço de pacotes ou no estado do Gateway do convidado.
  - A prova pós-atualização executa a superfície normal de plugins empacotados porque
    facades de capacidade, como fala, geração de imagem e entendimento de mídia,
    são carregadas por APIs de runtime empacotadas mesmo quando o turno do agente
    em si verifica apenas uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local do provedor AIMock para testes smoke
    diretos de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane de QA live do Matrix contra um homeserver Tuwunel descartável com suporte de Docker. Somente checkout do código-fonte - instalações empacotadas não incluem `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, variáveis de ambiente e layout de artefatos: [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a lane de QA live do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do ambiente.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais agrupadas compartilhadas. Use o modo env por padrão ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases agrupados.
  - Os padrões cobrem canary, bloqueio por menção, endereçamento de comandos, `/status`, respostas mencionadas de bot para bot e respostas a comandos nativos centrais. Os padrões de `mock-openai` também cobrem regressões determinísticas de cadeia de respostas e de streaming da mensagem final do Telegram. Use `--list-scenarios` para probes opcionais como `session_status`.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída com falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, habilite Bot-to-Bot Communication Mode em `@BotFather` para ambos os bots e garanta que o bot driver consiga observar o tráfego de bots do grupo.
  - Escreve um relatório de QA do Telegram, resumo e `qa-evidence.json` em `.artifacts/qa-e2e/...`. Cenários com resposta incluem RTT desde a solicitação de envio do driver até a resposta observada do SUT.

`Mantis Telegram Live` é o wrapper de evidência de PR em torno desta lane. Ele executa a
ref candidata com credenciais do Telegram alugadas via Convex, renderiza o pacote redigido de
relatório/evidência de QA em um navegador desktop Crabbox, grava evidência em MP4,
gera um GIF recortado por movimento, faz upload do pacote de artefatos e publica evidência
inline no PR por meio do Mantis GitHub App quando `pr_number` está definido. Mantenedores podem
iniciá-lo pela UI do Actions por meio de `Mantis Scenario` (`scenario_id:
telegram-live`) ou diretamente por um comentário em pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` é o wrapper agêntico nativo do Telegram Desktop
antes/depois para prova visual de PR. Inicie-o pela UI do Actions com
`instructions` livres, por meio de `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) ou a partir de um comentário em PR:

```text
@openclaw-mantis telegram desktop proof
```

O agente Mantis lê o PR, decide qual comportamento visível no Telegram prova a
alteração, executa a lane de prova do Telegram Desktop Crabbox com usuário real nas refs baseline e
candidata, itera até que os GIFs nativos sejam úteis, escreve um manifesto pareado
`motionPreview` e publica a mesma tabela de GIFs em 2 colunas por meio do
Mantis GitHub App quando `pr_number` está definido.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Aluga ou reutiliza um desktop Linux Crabbox, instala o Telegram Desktop nativo, configura o OpenClaw com um token de bot SUT do Telegram alugado, inicia o gateway e grava evidência de screenshot/MP4 a partir do desktop VNC visível.
  - O padrão é `--credential-source convex`, para que os workflows precisem apenas do segredo do broker Convex. Use `--credential-source env` com as mesmas variáveis `OPENCLAW_QA_TELEGRAM_*` que `pnpm openclaw qa telegram`.
  - O Telegram Desktop ainda precisa de login/perfil de usuário. O token do bot configura apenas o OpenClaw. Use `--telegram-profile-archive-env <name>` para um arquivo de perfil `.tgz` em base64, ou use `--keep-lease` e faça login manualmente via VNC uma vez.
  - Escreve `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4` no diretório de saída.

Lanes de transporte live compartilham um contrato padrão para que novos transportes não divirjam; a matriz de cobertura por lane fica em [visão geral de QA → Cobertura de transporte live](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` é a suíte sintética ampla e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
QA de transporte live, o laboratório de QA adquire um lease exclusivo de um pool com suporte de Convex, envia Heartbeats para esse
lease enquanto a lane está em execução e libera o lease no desligamento. O nome da seção é anterior
ao suporte a Discord, Slack e WhatsApp; o contrato de lease é compartilhado entre tipos.

Scaffold de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo, `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção de função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão de env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` em CI, caso contrário `maintainer`)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desenvolvimento somente local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar no pool) exigem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções live para verificar a URL do site Convex, segredos do broker,
prefixo do endpoint, timeout HTTP e alcançabilidade de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e
utilitários de CI.

Contrato de endpoint padrão (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Requisição: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/repetível: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Sucesso: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /release`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /admin/add` (somente segredo de mantenedor)
  - Requisição: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (somente segredo de mantenedor)
  - Requisição: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato de payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string de id numérico de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

Formato de payload para o tipo usuário real do Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` e `telegramApiId` devem ser strings numéricas.
- `tdlibArchiveSha256` e `desktopTdataArchiveSha256` devem ser strings hexadecimais SHA-256.
- `kind: "telegram-user"` é reservado para o workflow de prova do Mantis Telegram Desktop. Lanes genéricas do QA Lab não devem adquiri-lo.

Payloads multicanal validados pelo broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Lanes do Slack também podem alugar do pool, mas a validação de payload do Slack atualmente
fica no runner de QA do Slack, não no broker. Use
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para linhas do Slack.

### Adicionando um canal ao QA

A arquitetura e os nomes de helpers de cenário para novos adaptadores de canal ficam em [visão geral de QA → Adicionando um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel). O mínimo exigido: implementar o runner de transporte na interface compartilhada do host `qa-lab`, declarar `qaRunners` no manifesto do Plugin, montar como `openclaw qa <runner>` e criar cenários em `qa/scenarios/`.

## Suítes de teste (o que roda onde)

Pense nas suítes como "realismo crescente" (e flakiness/custo crescentes):

### Unidade / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards multiprojeto em configurações por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; testes unitários de UI rodam no shard dedicado `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração no processo (autenticação do Gateway, roteamento, tooling, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não exige chaves reais
  - Deve ser rápido e estável
  - Testes de resolvedor e loader de superfície pública devem provar comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com fixtures minúsculas de Plugin geradas, não
    APIs reais de código-fonte de Plugins empacotados. Carregamentos reais de API de Plugin pertencem às
    suítes de contrato/integração de propriedade do Plugin.

Política de dependência nativa:

- Instalações de teste padrão pulam builds opcionais nativos do opus do Discord. Voz do Discord usa `libopus-wasm` empacotado, e `@discordjs/opus` permanece desabilitado em `allowBuilds` para que testes locais e lanes Testbox não compilem o addon nativo.
- Compare o desempenho do opus nativo no repositório de benchmark `libopus-wasm`, não nos loops padrão de instalação/teste do OpenClaw. Não defina `@discordjs/opus` como `true` no `allowBuilds` padrão; isso faz loops de instalação/teste não relacionados compilarem código nativo.

<AccordionGroup>
  <Accordion title="Projetos, shards e lanes com escopo">

    - Execuções não direcionadas de `pnpm test` rodam doze configurações menores de shards (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo nativo gigante do projeto raiz. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensões prive suítes não relacionadas de recursos.
    - `pnpm test --watch` ainda usa o grafo de projeto raiz nativo de `vitest.config.ts`, porque um loop de observação com múltiplos shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo completo de inicialização do projeto raiz.
    - `pnpm test:changed` expande caminhos git alterados para lanes baratas com escopo por padrão: edições diretas de testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de código-fonte e dependentes locais do grafo de importação. Edições de config/setup/package não executam testes amplamente, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é o gate normal de verificação local inteligente para trabalho estreito. Ele classifica o diff em core, testes do core, extensões, testes de extensão, apps, docs, metadados de release, ferramentas Docker live e tooling, depois roda os comandos correspondentes de typecheck, lint e guard. Ele não roda testes Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explícito para prova de teste. Aumentos de versão somente em metadados de release rodam verificações direcionadas de versão/config/dependência raiz, com um guard que rejeita alterações de pacote fora do campo de versão de nível superior.
    - Edições no harness Docker ACP live rodam verificações focadas: sintaxe de shell para os scripts de autenticação Docker live e um dry-run do agendador Docker live. Alterações em `package.json` são incluídas somente quando o diff é limitado a `scripts["test:docker:live-*"]`; edições de dependência, exportação, versão e outras superfícies de pacote ainda usam os guards mais amplos.
    - Testes unitários leves em importação de agents, commands, plugins, auxiliares de auto-reply, `plugin-sdk` e áreas similares de utilitários puros são roteados pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/pesados de runtime permanecem nas lanes existentes.
    - Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, então edições de auxiliares evitam reexecutar a suíte pesada completa desse diretório.
    - `auto-reply` tem buckets dedicados para auxiliares de core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. O CI divide ainda mais a subárvore de reply em shards de agent-runner, dispatch e commands/roteamento de estado, para que um bucket pesado em importação não seja dono de toda a cauda do Node.
    - O CI normal de PR/main ignora intencionalmente a varredura em lote de extensões e o shard `agentic-plugins` somente de release. A Validação Completa de Release dispara o workflow filho separado `Plugin Prerelease` para essas suítes pesadas de plugin/extensão em candidatos a release.

  </Accordion>

  <Accordion title="Cobertura do runner embutido">

    - Quando você alterar entradas de descoberta de message-tool ou contexto de runtime de compaction, mantenha os dois níveis de cobertura.
    - Adicione regressões focadas de auxiliares para limites puros de roteamento e normalização.
    - Mantenha saudáveis as suítes de integração do runner embutido:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` e
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam que IDs com escopo e comportamento de compaction ainda fluem pelos caminhos reais de `run.ts` / `compact.ts`; testes apenas de auxiliares não são substitutos suficientes para esses caminhos de integração.

  </Accordion>

  <Accordion title="Padrões de pool e isolamento do Vitest">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o runner não isolado nos projetos raiz, configurações e2e e live.
    - A lane de UI raiz mantém seu setup e otimizador `jsdom`, mas também roda no runner compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão aos processos Node filhos do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais.
      Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento padrão do V8.
    - `scripts/run-vitest.mjs` encerra execuções explícitas não-watch do Vitest após 5 minutos sem saída em stdout ou stderr. Defina
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desabilitar o watchdog em uma investigação intencionalmente silenciosa.

  </Accordion>

  <Accordion title="Iteração local rápida">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook pre-commit é somente de formatação. Ele reencena arquivos formatados e não roda lint, typecheck nem testes.
    - Rode `pnpm check:changed` explicitamente antes do handoff ou push quando precisar do gate de verificação local inteligente.
    - `pnpm test:changed` roteia por lanes baratas com escopo por padrão. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando o agente decidir que uma edição de harness, config, package ou contrato realmente precisa de cobertura Vitest mais ampla.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
    - O autoescalonamento local de workers é intencionalmente conservador e recua quando a média de carga do host já está alta, então várias execuções Vitest concorrentes causam menos impacto por padrão.
    - A configuração base do Vitest marca os arquivos de projetos/config como `forceRerunTriggers` para que reexecuções em modo changed permaneçam corretas quando a fiação de testes mudar.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser uma localização explícita de cache para profiling direto.

  </Accordion>

  <Accordion title="Depuração de performance">

    - `pnpm test:perf:imports` habilita o relatório de duração de importações do Vitest mais a saída de detalhamento de importações.
    - `pnpm test:perf:imports:changed` aplica a mesma visualização de profiling aos arquivos alterados desde `origin/main`.
    - Dados de tempo de shards são gravados em `.artifacts/vitest-shard-timings.json`.
      Execuções de configuração inteira usam o caminho da configuração como chave; shards de CI com padrão de inclusão anexam o nome do shard para que shards filtrados possam ser rastreados separadamente.
    - Quando um teste quente ainda passa a maior parte do tempo em importações de inicialização, mantenha dependências pesadas atrás de uma seam local estreita `*.runtime.ts` e faça mock dessa seam diretamente, em vez de importar profundamente auxiliares de runtime apenas para passá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o `test:changed` roteado com o caminho nativo do projeto raiz para esse diff commitado e imprime o tempo de parede mais o RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore suja atual roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de inicialização e transform do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unitária com paralelismo de arquivos desabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidade (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada a um worker
- Escopo:
  - Inicia um Gateway real de loopback com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagens, memória e payloads grandes do Gateway pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` pelo RPC WS do Gateway
  - Cobre auxiliares de persistência do bundle de estabilidade de diagnóstico
  - Afirma que o recorder permanece limitado, amostras sintéticas de RSS ficam abaixo do orçamento de pressão e profundidades de fila por sessão voltam a zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não um substituto para a suíte completa do Gateway

### E2E (agregado do repositório)

- Comando: `pnpm test:e2e`
- Escopo:
  - Roda a lane E2E de smoke do gateway
  - Roda a lane E2E de navegador mockado da Control UI
- Expectativas:
  - Seguro para CI e sem chaves
  - Exige que o Playwright Chromium esteja instalado

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e:gateway`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins empacotados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, correspondendo ao restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir overhead de E/S no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end de gateway multi-instância
  - Superfícies WebSocket/HTTP, pareamento de nodes e networking mais pesado
- Expectativas:
  - Roda no CI (quando habilitado no pipeline)
  - Nenhuma chave real necessária
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E (navegador mockado da Control UI)

- Comando: `pnpm test:ui:e2e`
- Configuração: `test/vitest/vitest.ui-e2e.config.ts`
- Arquivos: `ui/src/**/*.e2e.test.ts`
- Escopo:
  - Inicia a Control UI do Vite
  - Conduz uma página real do Chromium pelo Playwright
  - Substitui o WebSocket do Gateway por mocks determinísticos no navegador
- Expectativas:
  - Roda no CI como parte de `pnpm test:e2e`
  - Nenhum Gateway real, agents ou chaves de provedor são necessários
  - A dependência de navegador deve estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Reutiliza um gateway OpenShell local ativo
  - Cria uma sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` real + exec SSH
  - Verifica o comportamento de filesystem canônico remoto pela ponte fs da sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Exige uma CLI `openshell` local mais um daemon Docker funcional
  - Exige um gateway OpenShell local ativo e sua fonte de configuração
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói a sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao rodar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para expor a configuração do gateway registrado ao teste isolado
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para substituir o IP do gateway Docker usado pelo fixture de política do host

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de plugins integrados em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - "Este provedor/modelo realmente funciona _hoje_ com credenciais reais?"
  - Detectar mudanças de formato do provedor, particularidades de chamada de ferramentas, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável para CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos reduzidos em vez de "tudo"
- Execuções live usam chaves de API já exportadas e perfis de autenticação preparados.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de configuração/autenticação para uma home temporária de teste, para que fixtures unitárias não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando você precisar intencionalmente que testes live usem seu diretório home real.
- `pnpm test:live` usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...` e silencia logs de inicialização do gateway/ruído do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser recuperar os logs completos de inicialização.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por execução live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/heartbeat:
  - Suítes live agora emitem linhas de progresso para stderr, para que chamadas longas a provedores fiquem visivelmente ativas mesmo quando a captura do console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você alterou muita coisa)
- Tocando rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando "meu bot caiu" / falhas específicas de provedor / chamada de ferramentas: execute um `pnpm test:live` reduzido

## Testes live (que acessam rede)

Para a matriz de modelos live, testes de sanidade de backend da CLI, testes de sanidade de ACP, harness do servidor de app do Codex e todos os testes live de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem, música, vídeo, harness de mídia), além do tratamento de credenciais para execuções live, consulte [Testando suítes live](/pt-BR/help/testing-live). Para a checklist dedicada de atualização e validação de plugins, consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins).

## Runners Docker (verificações opcionais de "funciona no Linux")

Esses runners Docker se dividem em dois grupos:

- Runners de modelos live: `test:docker:live-models` e `test:docker:live-gateway` executam somente o arquivo live de chave de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração, workspace e arquivo opcional de env de perfil. Os pontos de entrada locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners Docker live mantêm seus próprios limites práticos quando necessário:
  `test:docker:live-models` usa por padrão o conjunto curado de alto sinal com suporte, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Defina `OPENCLAW_LIVE_MAX_MODELS`
  ou as variáveis de env do gateway quando você quiser explicitamente um limite menor ou uma varredura maior.
- `test:docker:all` cria a imagem Docker live uma vez via `test:docker:live-build`, empacota OpenClaw uma vez como tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e então cria/reutiliza duas imagens `scripts/e2e/Dockerfile`. A imagem básica é apenas o runner Node/Git para faixas de instalação/atualização/dependência de plugin; essas faixas montam o tarball pré-criado. A imagem funcional instala o mesmo tarball em `/app` para faixas de funcionalidade do app compilado. As definições de faixas Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregado usa um escalonador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla slots de processo, enquanto limites de recursos impedem que faixas pesadas live, de instalação npm e de múltiplos serviços comecem todas de uma vez. Se uma única faixa for mais pesada que os limites ativos, o escalonador ainda pode iniciá-la quando o pool está vazio e então mantê-la rodando sozinha até que haja capacidade novamente. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` somente quando o host Docker tiver mais folga. O runner executa por padrão uma pré-verificação Docker, remove contêineres OpenClaw E2E obsoletos, imprime status a cada 30 segundos, armazena tempos de faixas bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar primeiro faixas mais longas em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto ponderado de faixas sem criar nem executar Docker, ou `node scripts/test-docker-all.mjs --plan-json` para imprimir o plano de CI para faixas selecionadas, necessidades de pacote/imagem e credenciais.
- `Package Acceptance` é o gate de pacote nativo do GitHub para "este tarball instalável funciona como produto?". Ele resolve um pacote candidato de `source=npm`, `source=ref`, `source=url` ou `source=artifact`, faz upload dele como `package-under-test` e então executa as faixas Docker E2E reutilizáveis contra esse tarball exato em vez de reempacotar a ref selecionada. Os perfis são ordenados por abrangência: `smoke`, `package`, `product` e `full`. Consulte [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins) para o contrato de pacote/atualização/plugin, a matriz de sobrevivência de upgrade publicado, os padrões de release e a triagem de falhas.
- Verificações de build e release executam `scripts/check-cli-bootstrap-imports.mjs` após tsdown. O guard percorre o grafo compilado estático a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se a inicialização pré-dispatch importar dependências de pacote como Commander, interface de prompt, undici ou logging antes do dispatch do comando; ele também mantém o chunk de execução do gateway integrado dentro do orçamento e rejeita imports estáticos de caminhos frios conhecidos do gateway. O smoke da CLI empacotada também cobre ajuda raiz, ajuda de onboard, ajuda de doctor, status, esquema de configuração e um comando de listagem de modelos.
- A compatibilidade legada do Package Acceptance é limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse limite, o harness tolera apenas lacunas de metadados de pacotes lançados: entradas omitidas de inventário privado de QA, `gateway install --wrapper` ausente, arquivos de patch ausentes no fixture git derivado do tarball, `update.channel` persistido ausente, locais legados de registros de instalação de plugins, persistência ausente de registros de instalação do marketplace e migração de metadados de configuração durante `plugins update`. Para pacotes após `2026.4.25`, esses caminhos são falhas estritas.
- Runners de smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.
- Faixas Docker/Bash E2E que instalam o tarball OpenClaw empacotado por meio de `scripts/lib/openclaw-e2e-instance.sh` limitam `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (padrão `600s`; defina `0` para desabilitar o wrapper durante depuração).

Os runners Docker de modelos live também montam via bind apenas as homes de autenticação da CLI necessárias (ou todas as compatíveis quando a execução não está reduzida) e então as copiam para a home do contêiner antes da execução, para que OAuth de CLI externa possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness do servidor de app do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smokes de observabilidade: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` e `pnpm qa:observability:smoke` são faixas privadas de checkout de origem de QA. Elas intencionalmente não fazem parte das faixas Docker de release de pacote porque o tarball npm omite o QA Lab.
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente com tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala o tarball OpenClaw empacotado globalmente no Docker, configura OpenAI via onboarding com referência por env mais Telegram por padrão, executa doctor e executa uma rodada de agente OpenAI simulado. Reutilize um tarball pré-criado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule o rebuild no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke da jornada de usuário de release: `pnpm test:docker:release-user-journey` instala o tarball empacotado do OpenClaw globalmente em um home Docker limpo, executa onboarding, configura um provedor OpenAI simulado, executa um turno de agente, instala/desinstala plugins externos, configura o ClickClack contra um fixture local, verifica mensagens de saída/entrada, reinicia o Gateway e executa doctor.
- Smoke de onboarding tipado de release: `pnpm test:docker:release-typed-onboarding` instala o tarball empacotado, conduz `openclaw onboard` por um TTY real, configura OpenAI como provedor env-ref, verifica que não há persistência de chave bruta e executa um turno de agente simulado.
- Smoke de mídia/memória de release: `pnpm test:docker:release-media-memory` instala o tarball empacotado, verifica entendimento de imagem a partir de um anexo PNG, saída de geração de imagem compatível com OpenAI, recordação por busca de memória e sobrevivência da recordação após reinício do Gateway.
- Smoke de jornada de usuário de upgrade de release: `pnpm test:docker:release-upgrade-user-journey` instala, por padrão, a linha de base publicada mais recente anterior ao tarball candidato, configura estado de provedor/Plugin/ClickClack no pacote publicado, faz upgrade para o tarball candidato e então executa novamente a jornada central de agente/Plugin/canal. Se não existir uma linha de base publicada anterior, ele reutiliza a versão candidata. Substitua a linha de base com `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke de marketplace de Plugin de release: `pnpm test:docker:release-plugin-marketplace` instala a partir de um marketplace de fixture local, atualiza o Plugin instalado, desinstala-o e verifica que a CLI do Plugin desaparece com os metadados de instalação removidos.
- Smoke de instalação de Skill: `pnpm test:docker:skill-install` instala o tarball empacotado do OpenClaw globalmente no Docker, desabilita instalações de arquivos enviados na configuração, resolve o slug da skill atual ativa do ClawHub a partir da busca, instala-a com `openclaw skills install` e verifica a skill instalada mais os metadados de origem/bloqueio de `.clawhub`.
- Smoke de troca de canal de atualização: `pnpm test:docker:update-channel-switch` instala o tarball empacotado do OpenClaw globalmente no Docker, troca do pacote `stable` para git `dev`, verifica o canal persistido e o funcionamento do Plugin pós-atualização, depois troca de volta para o pacote `stable` e verifica o status de atualização.
- Smoke de sobrevivente de upgrade: `pnpm test:docker:upgrade-survivor` instala o tarball empacotado do OpenClaw sobre um fixture de usuário antigo sujo com agentes, configuração de canal, allowlists de Plugin, estado obsoleto de dependências de Plugin e arquivos de workspace/sessão existentes. Ele executa atualização de pacote mais doctor não interativo sem provedor ativo nem chaves de canal, depois inicia um Gateway de loopback e verifica preservação de configuração/estado mais orçamentos de inicialização/status.
- Smoke de sobrevivente de upgrade publicado: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente, configura essa linha de base com uma receita de comandos embutida, valida a configuração resultante, atualiza essa instalação publicada para o tarball candidato, executa doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, depois inicia um Gateway de loopback e verifica intenções configuradas, preservação de estado, inicialização, `/healthz`, `/readyz` e orçamentos de status RPC. Substitua uma linha de base com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, peça ao agendador agregado para expandir linhas de base locais exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, e expanda fixtures em formato de issue com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; o conjunto reported-issues inclui `configured-plugin-installs` para reparo automático da instalação de Plugin externo do OpenClaw. Package Acceptance expõe isso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, resolve tokens de linha de base meta como `last-stable-4` ou `all-since-2026.4.23`, e Full Release Validation expande o gate de pacote release-soak para `last-stable-4 2026.4.23 2026.5.2 2026.4.15` mais `reported-issues`.
- Smoke de contexto de runtime de sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta de transcrição de contexto de runtime mais o reparo por doctor dos ramos duplicados afetados de reescrita de prompt.
- Smoke de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala-a com `bun install -g` em um home isolado e verifica que `openclaw infer image providers --json` retorna provedores de imagem incluídos em vez de travar. Reutilize um tarball pré-construído com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a build do host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker construída com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um cache npm entre seus contêineres root, update e direct-npm. O smoke de atualização usa npm `latest` como linha de base estável por padrão antes de fazer upgrade para o tarball candidato. Substitua com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente ou com a entrada `update_baseline_version` do workflow Install Smoke no GitHub. As verificações de instalador sem root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em novas execuções locais.
- O CI Install Smoke pula a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa env quando for necessária cobertura direta de `npm install -g`.
- Smoke da CLI de exclusão de agentes com workspace compartilhado: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) constrói a imagem do Dockerfile raiz por padrão, semeia dois agentes com um workspace em um home de contêiner isolado, executa `agents delete --json` e verifica JSON válido mais o comportamento de workspace retido. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois contêineres, autenticação WS + integridade): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke de snapshot CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) constrói a imagem E2E de origem mais uma camada Chromium, inicia Chromium com CDP bruto, executa `browser doctor --deep` e verifica que snapshots de função CDP cobrem URLs de links, clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Regressão de raciocínio mínimo do OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado por meio do Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do esquema pelo provedor e verifica que o detalhe bruto aparece nos logs do Gateway.
- Ponte de canal MCP (Gateway semeado + ponte stdio + smoke de notification-frame bruto do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote OpenClaw (servidor MCP stdio real + smoke de permitir/negar perfil OpenClaw embutido): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + encerramento de filho MCP stdio após execuções isoladas de cron e subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências içadas, metadados de pacote npm malformados, refs móveis de git, kitchen-sink do ClawHub, atualizações de marketplace e habilitação/inspeção de pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para pular o bloco ClawHub ou substitua o par padrão pacote/runtime kitchen-sink com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor de fixture ClawHub local hermético.
- Smoke de atualização de Plugin inalterado: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de matriz de ciclo de vida de Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instala o tarball empacotado do OpenClaw em um contêiner básico, instala um Plugin npm, alterna habilitar/desabilitar, faz upgrade e downgrade dele por meio de um registro npm local, exclui o código instalado e então verifica que a desinstalação ainda remove estado obsoleto enquanto registra métricas de RSS/CPU para cada fase do ciclo de vida.
- Smoke de metadados de recarga de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cobre smoke de instalação/atualização para caminho local, `file:`, registro npm com dependências içadas, refs móveis de git, fixtures ClawHub, atualizações de marketplace e habilitação/inspeção de pacote Claude. `pnpm test:docker:plugin-update` cobre comportamento de atualização inalterado para plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cobre instalação, habilitação, desabilitação, upgrade, downgrade e desinstalação com código ausente de Plugin npm com recursos rastreados.

Para pré-construir e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas de suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts a baixam se ela ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação em vez do runtime de aplicativo construído compartilhado.

Os executores Docker de modelos live também montam o checkout atual como somente leitura e
o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a imagem
de runtime enxuta, ainda executando o Vitest contra sua fonte/configuração local exata.
A etapa de preparação ignora caches grandes apenas locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios de saída `.build` locais do app ou
do Gradle, para que execuções live no Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondagens live do gateway não iniciem
workers de canal reais do Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse também
`OPENCLAW_LIVE_GATEWAY_*` quando você precisar restringir ou excluir a cobertura live de gateway
dessa lane do Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner do gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixado do Open WebUI contra esse gateway, faz login pelo
Open WebUI, verifica que `/api/models` expõe `openclaw/default` e então envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI.
Defina `OPENWEBUI_SMOKE_MODE=models` para verificações de CI do caminho de release que devem parar
após o login no Open WebUI e a descoberta de modelos, sem aguardar uma conclusão de modelo live.
A primeira execução pode ser visivelmente mais lenta porque o Docker talvez precise baixar a
imagem do Open WebUI e o Open WebUI talvez precise concluir sua própria configuração de inicialização a frio.
Essa lane espera uma chave de modelo live utilizável. Forneça-a pelo ambiente do processo,
perfis de autenticação preparados ou um `OPENCLAW_PROFILE_FILE` explícito.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real do Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway semeado,
inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexos,
comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte MCP stdio real. A verificação de notificações
inspeciona diretamente os frames MCP stdio brutos, para que o smoke valide o que a
ponte realmente emite, não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:agent-bundle-mcp-tools` é determinístico e não precisa de uma chave de
modelo live. Ele cria a imagem Docker do repositório, inicia um servidor real de sondagem MCP stdio
dentro do contêiner, materializa esse servidor pelo runtime MCP do bundle OpenClaw
embutido, executa a ferramenta e então verifica que `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo live.
Ele inicia um Gateway semeado com um servidor real de sondagem MCP stdio, executa uma
rodada cron isolada e uma rodada filha única `sessions_spawn`, e então verifica
que o processo filho MCP sai após cada execução.

Smoke manual ACP de thread em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de trabalho de regressão/debug. Ele pode ser necessário novamente para validação de roteamento de threads ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montado e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de configuração/workspace e sem montagens externas de autenticação da CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação de CLI em `$HOME` são montados como somente leitura em `/host-auth...` e depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções com provedor restringido montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores no contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em novas execuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação por nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Sanidade da documentação

Execute as verificações de docs após edições na documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar de verificações de títulos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de "pipeline real" sem provedores reais:

- Chamada de ferramentas pelo Gateway (OpenAI mock, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade de agente (Skills)

Já temos alguns testes seguros para CI que se comportam como "avaliações de confiabilidade de agente":

- Chamada de ferramentas mock pelo gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos de assistente de ponta a ponta que validam a fiação de sessão e os efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes de usar e segue as etapas/argumentos obrigatórios?
- **Contratos de fluxo de trabalho:** cenários multi-turno que afirmam ordem de ferramentas, preservação do histórico de sessão e limites de sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um executor de cenários usando provedores mock para afirmar chamadas de ferramentas + ordem, leituras de arquivos de Skill e fiação de sessão.
- Uma pequena suíte de cenários focados em Skills (usar vs evitar, gating, injeção de prompt).
- Avaliações live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (forma de plugin e canal)

Testes de contrato verificam que cada plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de
asserções de forma e comportamento. A lane de unidade padrão `pnpm test` intencionalmente
ignora esses arquivos compartilhados de borda e smoke; execute os comandos de contrato explicitamente
quando você tocar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ações de canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondagens de status de canal
- **registry** - Forma do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato do fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugins
- **loader** - Carregamento de plugins
- **runtime** - Runtime do provedor
- **shape** - Forma/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exports ou subpaths de plugin-sdk
- Após adicionar ou modificar um plugin de canal ou provedor
- Após refatorar registro ou descoberta de plugins

Testes de contrato rodam em CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrigir um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI se possível (provedor mock/stub ou capture a transformação exata da forma da solicitação)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in por variáveis de ambiente
- Prefira mirar na menor camada que captura o bug:
  - bug de conversão/replay de solicitação do provedor → teste direto de modelos
  - bug de sessão/histórico/pipeline de ferramentas do gateway → smoke live de gateway ou teste mock de gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`) e então afirma que ids exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvos SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testando live](/pt-BR/help/testing-live)
- [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins)
- [CI](/pt-BR/ci)
