---
read_when:
    - Executando testes localmente ou no CI
    - Adicionando regressões para bugs de modelo/provedor
    - Depuração do comportamento do Gateway + agente
summary: 'Kit de testes: suítes unitárias/e2e/ao vivo, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-07-04T03:39:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw tem três suítes Vitest (unitária/integração, e2e, ao vivo) e um pequeno conjunto
de executores Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre).
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração).
- Como os testes ao vivo descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelo/provedor.

<Note>
**A pilha de QA (qa-lab, qa-channel, faixas de transporte ao vivo)** é documentada separadamente:

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) - arquitetura, superfície de comandos, autoria de cenários.
- [QA de matriz](/pt-BR/concepts/qa-matrix) - referência para `pnpm openclaw qa matrix`.
- [Quadro de maturidade](/pt-BR/maturity/scorecard) - como as evidências de QA de release dão suporte a decisões de estabilidade e LTS.
- [Canal de QA](/pt-BR/channels/qa-channel) - o Plugin de transporte sintético usado por cenários respaldados pelo repositório.

Esta página cobre a execução das suítes de teste regulares e dos executores Docker/Parallels. A seção de executores específicos de QA abaixo ([executores específicos de QA](#qa-specific-runners)) lista as invocações concretas de `qa` e remete às referências acima.
</Note>

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina espaçosa: `pnpm test:max`
- Loop direto de observação do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivos agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando em uma única falha.
- Site de QA respaldado por Docker: `pnpm qa:lab:up`
- Faixa de QA respaldada por VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você tocar em testes ou quiser confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte e2e: `pnpm test:e2e`

## Diretórios temporários de teste

Prefira os helpers compartilhados em `test/helpers/temp-dir.ts` para diretórios
temporários pertencentes aos testes. Eles tornam a propriedade explícita e mantêm a limpeza no mesmo
ciclo de vida do teste:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` intencionalmente não expõe nenhum método de limpeza manual; o Vitest
é dono da limpeza após cada teste. Os helpers de nível mais baixo existentes permanecem para testes que
ainda não foram migrados, mas testes novos e migrados devem usar o rastreador
com limpeza automática. Evite novo uso manual de `makeTempDir`, `cleanupTempDirs` ou
`createTempDirTracker` e evite novas chamadas diretas a `fs.mkdtemp*` em testes,
a menos que um caso esteja verificando explicitamente o comportamento bruto de diretório temporário. Adicione um comentário de permissão auditável
com um motivo concreto quando um teste precisar intencionalmente de um diretório temporário direto:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Para visibilidade de migração, `node scripts/report-test-temp-creations.mjs` relata
novas criações diretas de diretório temporário e novo uso manual de helper compartilhado em linhas
adicionadas no diff sem bloquear estilos de limpeza existentes. Seu escopo de arquivo intencionalmente
segue a mesma classificação de caminhos de teste usada por `scripts/changed-lanes.mjs`
em vez de manter uma heurística separada de nome de arquivo de helper de teste, enquanto ignora
a própria implementação do helper compartilhado. `check:changed` executa esse relatório para
caminhos de teste alterados como um sinal de CI apenas de aviso; achados são anotações de aviso
do GitHub, não falhas.

Ao depurar provedores/modelos reais (exige credenciais reais):

- Suíte ao vivo (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcione silenciosamente um arquivo ao vivo: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Relatórios de desempenho de runtime: dispare `OpenClaw Performance` com
  `live_openai_candidate=true` para uma rodada real de agente `openai/gpt-5.5` ou
  `deep_profile=true` para artefatos de CPU/heap/trace do Kova. Execuções agendadas diárias
  publicam artefatos das faixas de provedor simulado, perfil profundo e GPT 5.5 em
  `openclaw/clawgrit-reports` quando `CLAWGRIT_REPORTS_TOKEN` está configurado. O
  relatório de provedor simulado também inclui inicialização do Gateway em nível de fonte, memória,
  pressão de Plugin, loop de saudação repetido com modelo falso e números de inicialização da CLI.
- Varredura de modelos ao vivo com Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa uma rodada de texto mais uma pequena sonda no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam uma pequena rodada com imagem.
    Desative as sondas extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas de provedor.
  - Cobertura de CI: `OpenClaw Scheduled Live And E2E Checks` diário e
    `OpenClaw Release Checks` manual chamam o fluxo reutilizável ao vivo/E2E com
    `include_live_suites: true`, que inclui jobs de matriz separados para modelos ao vivo em Docker,
    particionados por provedor.
  - Para reexecuções focadas de CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke nativo de chat vinculado do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma faixa Docker ao vivo contra o caminho do app-server do Codex, vincula uma
    DM sintética do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, depois verifica uma resposta simples e uma rota de anexo de imagem
    pela vinculação nativa do Plugin em vez de ACP.
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness`
  - Executa rodadas de agente do Gateway pelo harness app-server do Codex pertencente ao Plugin,
    verifica `/codex status` e `/codex models`, e por padrão exercita sondas de imagem,
    MCP Cron, subagente e Guardian. Desative a sonda de subagente com
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` ao isolar outras falhas do
    app-server do Codex. Para uma verificação focada de subagente, desative as outras sondas:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Isso encerra após a sonda de subagente, a menos que
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` esteja definido.
- Smoke de instalação sob demanda do Codex: `pnpm test:docker:codex-on-demand`
  - Instala o tarball empacotado do OpenClaw no Docker, executa onboarding com chave de API
    da OpenAI e verifica se o Plugin Codex mais a dependência `@openai/codex`
    foram baixados sob demanda para a raiz gerenciada do projeto npm.
- Smoke de dependência de ferramenta de Plugin ao vivo: `pnpm test:docker:live-plugin-tool`
  - Empacota um Plugin de fixture com uma dependência real `slugify`, instala-o por
    `npm-pack:`, verifica a dependência sob a raiz gerenciada do projeto npm,
    depois pede que um modelo OpenAI ao vivo chame a ferramenta do Plugin e retorne o slug
    oculto.
- Smoke de comando de resgate do Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Verificação opcional de cinto e suspensórios para a superfície de comando de resgate do canal de mensagens.
    Ela exercita `/crestodian status`, enfileira uma mudança persistente de modelo,
    responde `/crestodian yes` e verifica o caminho de gravação de auditoria/configuração.
- Smoke Docker do planejador Crestodian: `pnpm test:docker:crestodian-planner`
  - Executa o Crestodian em um contêiner sem configuração com uma CLI Claude falsa no `PATH`
    e verifica se o fallback de planejador aproximado se traduz em uma gravação de configuração tipada
    auditada.
- Smoke Docker de primeira execução do Crestodian: `pnpm test:docker:crestodian-first-run`
  - Começa a partir de um diretório de estado vazio do OpenClaw, verifica o ponto de entrada moderno
    de onboarding do Crestodian, aplica gravações de configuração/modelo/agente/Plugin Discord + SecretRef,
    valida a configuração e verifica entradas de auditoria. O mesmo caminho de configuração Ring 0
    também é coberto no QA Lab por
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON relata Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

<Tip>
Quando você só precisa de um caso que falha, prefira restringir testes ao vivo pelas variáveis de ambiente de lista de permissão descritas abaixo.
</Tip>

## Executores específicos de QA

Estes comandos ficam ao lado das suítes de teste principais quando você precisa de realismo de QA Lab:

O CI executa o QA Lab em fluxos dedicados. A paridade agêntica fica aninhada sob
`QA-Lab - All Lanes` e validação de release, não em um fluxo de PR independente.
A validação ampla deve usar `Full Release Validation` com
`rerun_group=qa-parity` ou o grupo de QA de verificações de release. As verificações
stable/default de release mantêm o soak exaustivo ao vivo/Docker atrás de `run_release_soak=true`; o
perfil `full` força o soak. `QA-Lab - All Lanes`
é executado todas as noites em `main` e por disparo manual com a faixa de paridade simulada, a faixa
Matrix ao vivo, a faixa Telegram ao vivo gerenciada pelo Convex e a faixa Discord
ao vivo gerenciada pelo Convex como jobs paralelos. QA agendado e verificações de release passam
`--profile fast` explicitamente para o Matrix, enquanto a CLI Matrix e a entrada manual do fluxo
continuam com padrão `all`; o disparo manual pode particionar `all` em jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` e `e2ee-cli`. `OpenClaw Release
Checks` executa a paridade mais as faixas Matrix rápida e Telegram antes da aprovação
de release, usando `mock-openai/gpt-5.5` para verificações de transporte de release para que elas permaneçam
determinísticas e evitem a inicialização normal de Plugin de provedor. Esses Gateways de transporte ao vivo
desativam a busca de memória; o comportamento de memória permanece coberto pelas suítes de paridade
de QA.

Partições de mídia ao vivo de release completo usam
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que já tem
`ffmpeg` e `ffprobe`. Partições de modelos/backends ao vivo em Docker usam a imagem compartilhada
`ghcr.io/openclaw/openclaw-live-test:<sha>` criada uma vez por commit
selecionado, depois a baixam com `OPENCLAW_SKIP_DOCKER_BUILD=1` em vez de reconstruir
dentro de cada partição.

- `pnpm openclaw qa suite`
  - Executa cenários de QA baseados no repositório diretamente no host.
  - Grava artefatos de nível superior `qa-evidence.json`, `qa-suite-summary.json` e
    `qa-suite-report.md` para o conjunto de cenários selecionado, incluindo
    seleções de cenários de fluxo misto, Vitest e Playwright.
  - Quando disparado por `pnpm openclaw qa run --qa-profile <profile>`, incorpora o
    scorecard do perfil de taxonomia selecionado no mesmo `qa-evidence.json`.
    `smoke-ci` grava evidência enxuta, que define `evidenceMode: "slim"` e omite
    `execution` por entrada. `release` cobre o recorte curado de prontidão para release;
    `all` seleciona todas as categorias de maturidade ativas e é destinado a disparos
    explícitos do fluxo de trabalho QA Profile Evidence quando um artefato de scorecard
    completo é necessário.
  - Executa vários cenários selecionados em paralelo por padrão com workers de
    gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a
    contagem de workers, ou `--concurrency 1` para a faixa serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída com falha.
  - Dá suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local baseado em AIMock para cobertura
    experimental de fixture e mock de protocolo sem substituir a faixa
    `mock-openai` ciente de cenários.
- `pnpm openclaw qa coverage --match <query>`
  - Pesquisa IDs de cenário, títulos, superfícies, IDs de cobertura, referências de docs, referências de código,
    plugins e requisitos de provedor, depois imprime destinos de suíte correspondentes.
  - Use isto antes de uma execução do QA Lab quando você souber o comportamento ou caminho de arquivo alterado,
    mas não o menor cenário. É apenas consultivo; ainda escolha prova mock,
    live, Multipass, Matrix ou de transporte a partir do comportamento que está sendo alterado.
- `pnpm test:plugins:kitchen-sink-live`
  - Executa o desafio live do Plugin OpenAI Kitchen Sink pelo QA Lab. Ele
    instala o pacote externo Kitchen Sink, verifica o inventário da superfície do SDK de Plugin,
    testa `/healthz` e `/readyz`, registra evidência de CPU/RSS do gateway,
    executa um turno live do OpenAI e verifica diagnósticos adversariais.
    Requer autenticação live do OpenAI, como `OPENAI_API_KEY`. Em sessões Testbox
    hidratadas, ele carrega automaticamente o perfil de autenticação live do Testbox quando o
    helper `openclaw-testbox-env` está presente.
- `pnpm test:gateway:cpu-scenarios`
  - Executa o benchmark de inicialização do Gateway mais um pequeno pacote de cenários mock do QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) e grava um resumo combinado de observação de CPU
    em `.artifacts/gateway-cpu-scenarios/`.
  - Sinaliza apenas observações sustentadas de CPU alta por padrão (`--cpu-core-warn`
    mais `--hot-wall-warn-ms`), então rajadas curtas de inicialização são registradas como métricas
    sem parecer a regressão de Gateway preso por vários minutos.
  - Usa artefatos `dist` compilados; execute um build primeiro quando o checkout ainda não
    tiver saída de runtime recente.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reusa as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA compatíveis que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live de QA e `CODEX_HOME`
    quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta pelo
    workspace montado.
  - Grava o relatório + resumo normais de QA mais logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA baseado em Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Constrói um tarball npm a partir do checkout atual, instala-o globalmente no
    Docker, executa onboarding não interativo com chave de API da OpenAI, configura Telegram
    por padrão, verifica que o runtime de Plugin empacotado carrega sem reparo de
    dependências na inicialização, executa doctor e executa um turno de agente local contra um
    endpoint OpenAI mockado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma faixa de instalação empacotada
    com Discord.
- `pnpm test:docker:session-runtime-context`
  - Executa um smoke determinístico em Docker do app compilado para transcrições de contexto de runtime
    embutido. Ele verifica que o contexto de runtime oculto do OpenClaw é persistido como uma
    mensagem customizada não exibida em vez de vazar para o turno visível do usuário,
    depois semeia um JSONL de sessão quebrada afetada e verifica que
    `openclaw doctor --fix` o reescreve para a ramificação ativa com um backup.
- `pnpm test:docker:npm-telegram-live`
  - Instala um candidato de pacote OpenClaw no Docker, executa onboarding do pacote instalado,
    configura Telegram pela CLI instalada, depois reusa a faixa live de QA do Telegram
    com esse pacote instalado como o Gateway SUT.
  - O wrapper monta apenas o código-fonte do harness `qa-lab` a partir do checkout; o
    pacote instalado é dono de `dist`, `openclaw/plugin-sdk` e do runtime de Plugin
    empacotado, para que a faixa não misture plugins do checkout atual no pacote
    em teste.
  - O padrão é `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; defina
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` ou
    `OPENCLAW_CURRENT_PACKAGE_TGZ` para testar um tarball local resolvido em vez de
    instalar a partir do registry.
  - Emite temporização RTT repetida em `qa-evidence.json` por padrão com
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Sobrescreva
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar a execução de RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` aceita uma lista separada por vírgulas de
    IDs de verificação de QA do Telegram para amostrar; quando não definido, a verificação padrão compatível com RTT
    é `telegram-mentioned-message-reply`.
  - Usa as mesmas credenciais env do Telegram ou fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de função Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - O wrapper valida o env de credenciais do Telegram ou Convex no host antes do
    trabalho de build/instalação no Docker. Defina `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    apenas ao depurar deliberadamente a configuração pré-credenciais.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sobrescreve o
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhado apenas para esta faixa. Quando credenciais Convex
    são selecionadas e nenhuma função é definida, o wrapper usa `ci` no CI e
    `maintainer` fora do CI.
  - GitHub Actions expõe esta faixa como o fluxo de trabalho manual de mantenedor
    `NPM Telegram Beta E2E`. Ele não roda em merge. O fluxo de trabalho usa o
    ambiente `qa-live-shared` e leases de credenciais CI do Convex.
- GitHub Actions também expõe `Package Acceptance` para prova de produto em execução lateral
  contra um pacote candidato. Ele aceita uma ref confiável, spec npm publicada,
  URL HTTPS de tarball mais SHA-256, ou artefato de tarball de outra execução, faz upload
  do `openclaw-current.tgz` normalizado como `package-under-test`, depois executa o
  agendador Docker E2E existente com perfis de faixa smoke, package, product, full ou custom.
  Defina `telegram_mode=mock-openai` ou `live-frontier` para executar o
  fluxo de trabalho de QA do Telegram contra o mesmo artefato `package-under-test`.
  - Prova de produto da beta mais recente:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Prova por URL exata de tarball exige um digest e usa a política de segurança de URL pública:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Espelhos de tarball enterprise/privados usam uma política explícita de fonte confiável:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` lê `.github/package-trusted-sources.json` a partir da ref confiável do fluxo de trabalho e não aceita credenciais de URL nem bypass de rede privada por entrada de fluxo de trabalho. Se a política nomeada declarar auth bearer, configure o segredo fixo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Prova por artefato baixa um artefato de tarball de outra execução do Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Empacota e instala o build atual do OpenClaw no Docker, inicia o Gateway
    com OpenAI configurado, depois habilita canais/plugins empacotados por meio de edições
    de config.
  - Verifica que a descoberta de setup deixa ausentes plugins baixáveis não configurados,
    que o primeiro reparo configurado do doctor instala explicitamente cada Plugin baixável
    ausente e que uma segunda reinicialização não executa reparo oculto de dependências.
  - Também instala uma baseline npm mais antiga conhecida, habilita Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica que o doctor pós-atualização do candidato
    limpa detritos legados de dependências de Plugin sem um reparo postinstall do lado do
    harness.
- `pnpm test:parallels:npm-update`
  - Executa o smoke nativo de atualização de instalação empacotada em guests Parallels. Cada
    plataforma selecionada primeiro instala o pacote baseline solicitado, depois executa
    o comando `openclaw update` instalado no mesmo guest e verifica a
    versão instalada, o status da atualização, a prontidão do gateway e um turno de agente local.
  - Use `--platform macos`, `--platform windows` ou `--platform linux` enquanto
    itera em um guest. Use `--json` para o caminho do artefato de resumo e
    status por faixa.
  - A faixa OpenAI usa `openai/gpt-5.5` para a prova live de turno de agente por
    padrão. Passe `--model <provider/model>` ou defina
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ao validar deliberadamente outro
    modelo OpenAI.
  - Envolva execuções locais longas em um timeout do host para que travamentos do transporte Parallels não
    consumam o restante da janela de testes:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - O script grava logs de faixa aninhados em `/tmp/openclaw-parallels-npm-update.*`.
    Inspecione `windows-update.log`, `macos-update.log` ou `linux-update.log`
    antes de assumir que o wrapper externo está travado.
  - A atualização do Windows pode passar 10 a 15 minutos no doctor pós-atualização e no trabalho de
    atualização de pacotes em um guest frio; isso ainda é saudável quando o log de debug npm
    aninhado está avançando.
  - Não execute este wrapper agregado em paralelo com faixas de smoke individuais do Parallels
    macOS, Windows ou Linux. Elas compartilham estado da VM e podem colidir em
    restauração de snapshot, serviço de pacotes ou estado de gateway do guest.
  - A prova pós-atualização executa a superfície normal de Plugin empacotado porque
    facades de capacidade, como fala, geração de imagens e compreensão de mídia,
    são carregadas por meio de APIs de runtime empacotadas mesmo quando o turno de agente
    em si verifica apenas uma resposta de texto simples.

- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor provedor AIMock local para testes smoke diretos de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a via de QA ao vivo do Matrix contra um homeserver Tuwunel descartável com suporte de Docker. Somente checkout de código-fonte - instalações empacotadas não incluem `qa-lab`.
  - CLI completa, catálogo de perfis/cenários, variáveis de ambiente e layout de artefatos: [QA do Matrix](/pt-BR/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Executa a via de QA ao vivo do Telegram contra um grupo privado real usando os tokens do bot driver e do bot SUT vindos do ambiente.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por concessões em pool.
  - Os padrões cobrem canário, controle por menção, endereçamento de comandos, `/status`, respostas mencionadas de bot para bot e respostas de comandos nativos principais. Os padrões de `mock-openai` também cobrem regressões determinísticas de cadeia de respostas e streaming de mensagem final do Telegram. Use `--list-scenarios` para sondagens opcionais como `session_status`.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, habilite o Bot-to-Bot Communication Mode no `@BotFather` para ambos os bots e garanta que o bot driver consiga observar o tráfego de bots do grupo.
  - Grava um relatório de QA do Telegram, um resumo e `qa-evidence.json` em `.artifacts/qa-e2e/...`. Cenários com resposta incluem RTT desde a solicitação de envio do driver até a resposta observada do SUT.

`Mantis Telegram Live` é o wrapper de evidência de PR em torno desta via. Ele executa a
ref candidata com credenciais do Telegram concedidas pelo Convex, renderiza o pacote
redigido de relatório/evidência de QA em um navegador desktop Crabbox, grava evidência em MP4,
gera um GIF recortado por movimento, envia o pacote de artefatos e publica evidência inline no PR
por meio do Mantis GitHub App quando `pr_number` está definido. Mantenedores podem
iniciá-lo pela UI de Actions por meio de `Mantis Scenario` (`scenario_id:
telegram-live`) ou diretamente de um comentário em pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` é o wrapper agêntico nativo do Telegram Desktop
de antes/depois para prova visual de PR. Inicie-o pela UI de Actions com
`instructions` livres, por meio de `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), ou a partir de um comentário em PR:

```text
@openclaw-mantis telegram desktop proof
```

O agente Mantis lê o PR, decide qual comportamento visível no Telegram prova a
alteração, executa a via de prova real de Telegram Desktop no Crabbox nas refs baseline e
candidata, itera até que os GIFs nativos sejam úteis, grava um manifesto pareado
`motionPreview` e publica a mesma tabela de GIFs em 2 colunas por meio do
Mantis GitHub App quando `pr_number` está definido.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Concede ou reutiliza um desktop Linux Crabbox, instala o Telegram Desktop nativo, configura o OpenClaw com um token de bot SUT do Telegram concedido, inicia o gateway e grava evidência de captura de tela/MP4 a partir do desktop VNC visível.
  - Usa `--credential-source convex` por padrão para que os fluxos de trabalho precisem apenas do segredo do broker Convex. Use `--credential-source env` com as mesmas variáveis `OPENCLAW_QA_TELEGRAM_*` de `pnpm openclaw qa telegram`.
  - O Telegram Desktop ainda precisa de um login/perfil de usuário. O token do bot configura apenas o OpenClaw. Use `--telegram-profile-archive-env <name>` para um arquivo de perfil `.tgz` em base64, ou use `--keep-lease` e faça login manualmente pelo VNC uma vez.
  - Grava `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` e `telegram-desktop-builder.mp4` no diretório de saída.

As vias de transporte ao vivo compartilham um contrato padrão para que novos transportes não divirjam; a matriz de cobertura por via fica em [visão geral de QA → Cobertura de transporte ao vivo](/pt-BR/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` é a suíte sintética ampla e não faz parte dessa matriz.

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
QA de transporte ao vivo, o laboratório de QA adquire uma concessão exclusiva de um pool com suporte do Convex, envia Heartbeats para essa
concessão enquanto a via está em execução e libera a concessão no encerramento. O nome da seção é anterior ao
suporte a Discord, Slack e WhatsApp; o contrato de concessão é compartilhado entre tipos.

Scaffold de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para o papel selecionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção do papel da credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` em CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desenvolvimento apenas local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar pool) exigem
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Auxiliares de CLI para mantenedores:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` antes de execuções ao vivo para verificar a URL do site Convex, segredos do broker,
prefixo do endpoint, timeout de HTTP e alcance de admin/list sem imprimir
valores secretos. Use `--json` para saída legível por máquina em scripts e utilitários
de CI.

Contrato de endpoint padrão (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitação: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/tentável novamente: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Sucesso: `{ status: "ok", index, data }`
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
  - Proteção de concessão ativa: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Solicitação: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato de payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string de id numérico de chat do Telegram.
- `admin/add` valida este formato para `kind: "telegram"` e rejeita payloads malformados.

Formato de payload para o tipo de usuário real do Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` e `telegramApiId` devem ser strings numéricas.
- `tdlibArchiveSha256` e `desktopTdataArchiveSha256` devem ser strings hexadecimais SHA-256.
- `kind: "telegram-user"` é reservado para o fluxo de trabalho de prova do Mantis Telegram Desktop. Vias genéricas do QA Lab não devem adquiri-lo.

Payloads multicanal validados pelo broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

As vias do Slack também podem obter concessão do pool, mas a validação de payload do Slack atualmente
fica no executor de QA do Slack, não no broker. Use
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
para linhas do Slack.

### Adicionar um canal ao QA

A arquitetura e os nomes de auxiliares de cenário para novos adaptadores de canal ficam em [visão geral de QA → Adicionar um canal](/pt-BR/concepts/qa-e2e-automation#adding-a-channel). O requisito mínimo: implementar o executor de transporte no seam de host `qa-lab` compartilhado, declarar `qaRunners` no manifesto do Plugin, montar como `openclaw qa <runner>` e criar cenários em `qa/scenarios/`.

## Suítes de teste (o que roda onde)

Pense nas suítes como "realismo crescente" (e aumento de instabilidade/custo):

### Unitário / integração (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards multiprojeto em configs por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts` e `test/**/*.test.ts`; testes unitários de UI rodam no shard dedicado `unit-ui`
- Escopo:
  - Testes unitários puros
  - Testes de integração no processo (auth do gateway, roteamento, ferramentas, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não exige chaves reais
  - Deve ser rápido e estável
  - Testes de resolvedor e carregador de superfície pública devem provar o comportamento amplo de fallback de `api.js` e
    `runtime-api.js` com fixtures minúsculas de Plugin geradas, não
    APIs reais de código-fonte de Plugin empacotado. Carregamentos reais de API de Plugin pertencem a
    suítes de contrato/integração pertencentes ao Plugin.

Política de dependência nativa:

- Instalações de teste padrão pulam builds opcionais nativos de opus do Discord. A voz do Discord usa `libopus-wasm` empacotado, e `@discordjs/opus` permanece desabilitado em `allowBuilds` para que testes locais e vias Testbox não compilem o addon nativo.
- Compare o desempenho do opus nativo no repositório de benchmark de `libopus-wasm`, não nos loops padrão de instalação/teste do OpenClaw. Não defina `@discordjs/opus` como `true` no `allowBuilds` padrão; isso faz loops não relacionados de instalação/teste compilarem código nativo.

<AccordionGroup>
  <Accordion title="Projetos, shards e vias com escopo">

    - Execuções não direcionadas de `pnpm test` rodam doze configurações de shards menores (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo nativo gigante de projeto raiz. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensão prive suítes não relacionadas de recursos.
    - `pnpm test --watch` ainda usa o grafo de projetos raiz nativo de `vitest.config.ts`, porque um loop de observação com múltiplos shards não é prático.
    - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham destinos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo completo de inicialização do projeto raiz.
    - `pnpm test:changed` expande caminhos git alterados em lanes com escopo baratas por padrão: edições diretas de testes, arquivos irmãos `*.test.ts`, mapeamentos explícitos de código-fonte e dependentes locais do grafo de imports. Edições de configuração/setup/pacote não executam testes amplos, a menos que você use explicitamente `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` é o gate normal de verificação local inteligente para trabalho restrito. Ele classifica o diff em core, testes de core, extensões, testes de extensão, apps, docs, metadados de release, tooling de Docker live e tooling, e então executa os comandos correspondentes de typecheck, lint e guard. Ele não executa testes Vitest; chame `pnpm test:changed` ou `pnpm test <target>` explícito para prova de teste. Bumps de versão somente de metadados de release executam verificações direcionadas de versão/config/dependência raiz, com um guard que rejeita alterações de pacote fora do campo de versão de nível superior.
    - Edições do harness Docker ACP live executam verificações focadas: sintaxe de shell para os scripts de autenticação Docker live e uma simulação do agendador Docker live. Alterações em `package.json` são incluídas somente quando o diff se limita a `scripts["test:docker:live-*"]`; edições de dependência, exportação, versão e outras superfícies de pacote ainda usam os guards mais amplos.
    - Testes unitários leves de import de agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` e áreas semelhantes de utilitários puros são encaminhados pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/pesados de runtime permanecem nas lanes existentes.
    - Arquivos-fonte selecionados de helpers de `plugin-sdk` e `commands` também mapeiam execuções em modo alterado para testes irmãos explícitos nessas lanes leves, então edições de helpers evitam reexecutar a suíte pesada completa desse diretório.
    - `auto-reply` tem buckets dedicados para helpers de core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. O CI divide ainda mais a subárvore de reply em shards de agent-runner, dispatch e commands/state-routing, para que um bucket pesado em imports não detenha toda a cauda do Node.
    - O CI normal de PR/main ignora intencionalmente a varredura em lote de extensões e o shard `agentic-plugins` exclusivo de release. A Validação Completa de Release despacha o workflow filho separado `Plugin Prerelease` para essas suítes pesadas em plugins/extensões em candidatos a release.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Quando você alterar entradas de descoberta de ferramentas de mensagem ou contexto de runtime de Compaction, mantenha os dois níveis de cobertura.
    - Adicione regressões focadas de helpers para limites puros de roteamento e normalização.
    - Mantenha saudáveis as suítes de integração do executor embarcado:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` e
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Essas suítes verificam que ids com escopo e comportamento de Compaction ainda fluem pelos caminhos reais de `run.ts` / `compact.ts`; testes somente de helpers não são substituto suficiente para esses caminhos de integração.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - A configuração base do Vitest usa `threads` por padrão.
    - A configuração compartilhada do Vitest fixa `isolate: false` e usa o executor não isolado nos projetos raiz, nas configurações e2e e live.
    - A lane de UI raiz mantém seu setup `jsdom` e otimizador, mas também roda no executor compartilhado não isolado.
    - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
    - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão para processos Node filhos do Vitest, para reduzir churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o comportamento padrão do V8.
    - `scripts/run-vitest.mjs` encerra execuções Vitest explícitas sem watch após 5 minutos sem saída em stdout ou stderr. Defina `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` para desativar o watchdog em uma investigação intencionalmente silenciosa.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
    - O hook de pre-commit é apenas de formatação. Ele adiciona novamente ao staging os arquivos formatados e não executa lint, typecheck ou testes.
    - Execute `pnpm check:changed` explicitamente antes do handoff ou push quando precisar do gate local inteligente de verificação.
    - `pnpm test:changed` encaminha por lanes com escopo baratas por padrão. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` somente quando o agente decidir que uma edição de harness, configuração, pacote ou contrato realmente precisa de cobertura Vitest mais ampla.
    - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
    - O escalonamento automático de workers locais é intencionalmente conservador e recua quando a média de carga do host já está alta, então várias execuções Vitest simultâneas causam menos impacto por padrão.
    - A configuração base do Vitest marca os projetos/arquivos de configuração como `forceRerunTriggers`, para que reexecuções em modo alterado permaneçam corretas quando a fiação de testes muda.
    - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local de cache explícito para profiling direto.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` habilita relatório de duração de imports do Vitest, além de saída de detalhamento de imports.
    - `pnpm test:perf:imports:changed` aplica a mesma visão de profiling aos arquivos alterados desde `origin/main`.
    - Dados de tempo de shards são gravados em `.artifacts/vitest-shard-timings.json`. Execuções de configuração inteira usam o caminho da configuração como chave; shards de CI com padrão de inclusão acrescentam o nome do shard, para que shards filtrados possam ser rastreados separadamente.
    - Quando um teste quente ainda gasta a maior parte do tempo em imports de inicialização, mantenha dependências pesadas atrás de uma fronteira local estreita `*.runtime.ts` e simule essa fronteira diretamente, em vez de fazer deep import de helpers de runtime apenas para passá-los por `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo de projeto raiz para esse diff commitado e imprime tempo de parede mais RSS máximo no macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mede a árvore suja atual encaminhando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
    - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de inicialização e transformação do Vitest/Vite.
    - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do executor para a suíte unitária com paralelismo por arquivo desabilitado.

  </Accordion>
</AccordionGroup>

### Estabilidade (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada para um worker
- Escopo:
  - Inicia um Gateway de loopback real com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagens de gateway, memória e payloads grandes pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` pelo RPC WS do Gateway
  - Cobre helpers de persistência do pacote de estabilidade de diagnóstico
  - Verifica que o gravador permanece limitado, amostras sintéticas de RSS ficam abaixo do orçamento de pressão e profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressão de estabilidade, não um substituto para a suíte completa do Gateway

### E2E (agregado do repo)

- Comando: `pnpm test:e2e`
- Escopo:
  - Executa a lane E2E de smoke do gateway
  - Executa a lane E2E de navegador simulado da Control UI
- Expectativas:
  - Seguro para CI e sem chaves
  - Requer que o Chromium do Playwright esteja instalado

### E2E (smoke do Gateway)

- Comando: `pnpm test:e2e:gateway`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins empacotados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, correspondendo ao restante do repo.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir overhead de E/S no console.
- Overrides úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada no console.
- Escopo:
  - Comportamento fim a fim de Gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de nós e networking mais pesado
- Expectativas:
  - Executa no CI (quando habilitado no pipeline)
  - Não exige chaves reais
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E (navegador simulado da Control UI)

- Comando: `pnpm test:ui:e2e`
- Configuração: `test/vitest/vitest.ui-e2e.config.ts`
- Arquivos: `ui/src/**/*.e2e.test.ts`
- Escopo:
  - Inicia a Control UI do Vite
  - Conduz uma página real do Chromium pelo Playwright
  - Substitui o WebSocket do Gateway por mocks determinísticos no navegador
- Expectativas:
  - Executa no CI como parte de `pnpm test:e2e`
  - Não exige Gateway, agentes ou chaves de provedor reais
  - A dependência de navegador deve estar presente (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Reutiliza um Gateway OpenShell local ativo
  - Cria uma sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` real + exec SSH
  - Verifica o comportamento de sistema de arquivos canônico remoto pela ponte fs da sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local e um daemon Docker funcional
  - Requer um Gateway OpenShell local ativo e sua fonte de configuração
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói a sandbox de teste
- Overrides úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` para expor a configuração do Gateway registrado ao teste isolado
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` para substituir o IP do Gateway Docker usado pela fixture de política do host

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de Plugins empacotados em `extensions/`
- Padrão: **ativado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - "Este provedor/modelo realmente funciona _hoje_ com credenciais reais?"
  - Capturar mudanças de formato do provedor, particularidades de chamadas de ferramentas, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por definição (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos reduzidos em vez de "tudo"
- Execuções live usam chaves de API já exportadas e perfis de autenticação preparados.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de configuração/autenticação para uma home temporária de teste, para que fixtures de unidade não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando você precisar intencionalmente que os testes live usem seu diretório home real.
- `pnpm test:live` usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...` e silencia logs de inicialização do Gateway/ruído do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - Suítes live agora emitem linhas de progresso para stderr, para que chamadas longas a provedores fiquem visivelmente ativas mesmo quando a captura do console do Vitest estiver silenciosa.
  - `vitest.live.config.ts` desativa a interceptação de console do Vitest para que linhas de progresso de provedor/Gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de Gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Tocando rede do Gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando "meu bot está fora do ar" / falhas específicas de provedor / chamada de ferramentas: execute um `pnpm test:live` reduzido

## Testes live (que tocam rede)

Para a matriz de modelos live, smokes de backend da CLI, smokes de ACP, harness de servidor de app do Codex e todos os testes live de provedores de mídia (Deepgram, BytePlus, ComfyUI, imagem, música, vídeo, harness de mídia), além do tratamento de credenciais para execuções live, consulte [Testando suítes live](/pt-BR/help/testing-live). Para a checklist dedicada de atualização e validação de Plugins, consulte [Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins).

## Runners Docker (verificações opcionais de "funciona no Linux")

Estes runners Docker se dividem em dois grupos:

- Runners de modelos live: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live de chave de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração, workspace e arquivo env de perfil opcional. Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners live Docker mantêm seus próprios limites práticos onde necessário:
  `test:docker:live-models` usa por padrão o conjunto curado, compatível e de alto sinal, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Defina `OPENCLAW_LIVE_MAX_MODELS`
  ou as variáveis de ambiente do Gateway quando quiser explicitamente um limite menor ou uma varredura maior.
- `test:docker:all` cria a imagem Docker live uma vez via `test:docker:live-build`, empacota o OpenClaw uma vez como tarball npm por meio de `scripts/package-openclaw-for-docker.mjs` e então cria/reusa duas imagens de `scripts/e2e/Dockerfile`. A imagem base é apenas o runner Node/Git para lanes de instalação/atualização/dependências de Plugins; essas lanes montam o tarball pré-criado. A imagem funcional instala o mesmo tarball em `/app` para lanes de funcionalidade do app criado. As definições das lanes Docker ficam em `scripts/lib/docker-e2e-scenarios.mjs`; a lógica do planejador fica em `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` executa o plano selecionado. O agregado usa um escalonador local ponderado: `OPENCLAW_DOCKER_ALL_PARALLELISM` controla slots de processo, enquanto limites de recursos impedem que lanes pesadas live, de instalação npm e de múltiplos serviços iniciem todas ao mesmo tempo. Se uma única lane for mais pesada que os limites ativos, o escalonador ainda pode iniciá-la quando o pool estiver vazio e então mantê-la em execução sozinha até que a capacidade esteja disponível de novo. Os padrões são 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ajuste `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` somente quando o host Docker tiver mais folga. O runner realiza um preflight do Docker por padrão, remove contêineres E2E antigos do OpenClaw, imprime status a cada 30 segundos, armazena tempos de lanes bem-sucedidas em `.artifacts/docker-tests/lane-timings.json` e usa esses tempos para iniciar lanes mais longas primeiro em execuções posteriores. Use `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir o manifesto de lanes ponderado sem criar ou executar Docker, ou `node scripts/test-docker-all.mjs --plan-json` para imprimir o plano de CI das lanes selecionadas, necessidades de pacote/imagem e credenciais.
- `Package Acceptance` é o gate de pacote nativo do GitHub para "este tarball instalável funciona como produto?" Ele resolve um pacote candidato de `source=npm`, `source=ref`, `source=url` ou `source=artifact`, carrega-o como `package-under-test` e então executa as lanes Docker E2E reutilizáveis contra esse tarball exato em vez de reempacotar a ref selecionada. Os perfis são ordenados por abrangência: `smoke`, `package`, `product` e `full`. Consulte [Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins) para o contrato de pacote/atualização/Plugin, matriz de sobrevivência de upgrades publicados, padrões de release e triagem de falhas.
- Verificações de build e release executam `scripts/check-cli-bootstrap-imports.mjs` depois do tsdown. O guard percorre o grafo estático criado a partir de `dist/entry.js` e `dist/cli/run-main.js` e falha se a inicialização pré-dispatch importar dependências de pacote como Commander, UI de prompt, undici ou logging antes do dispatch do comando; ele também mantém o chunk empacotado de execução do Gateway dentro do orçamento e rejeita imports estáticos de caminhos frios conhecidos do Gateway. O smoke da CLI empacotada também cobre ajuda raiz, ajuda de onboard, ajuda de doctor, status, esquema de configuração e um comando de listagem de modelos.
- A compatibilidade legada do Package Acceptance é limitada a `2026.4.25` (`2026.4.25-beta.*` incluído). Até esse corte, o harness tolera apenas lacunas de metadados de pacote lançado: entradas privadas de inventário de QA omitidas, ausência de `gateway install --wrapper`, ausência de arquivos de patch no fixture git derivado do tarball, ausência de `update.channel` persistido, locais legados de registros de instalação de Plugins, ausência de persistência de registros de instalação do marketplace e migração de metadados de configuração durante `plugins update`. Para pacotes após `2026.4.25`, esses caminhos são falhas estritas.
- Runners de smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.
- Lanes E2E Docker/Bash que instalam o tarball empacotado do OpenClaw por meio de `scripts/lib/openclaw-e2e-instance.sh` limitam `npm install` a `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (padrão `600s`; defina `0` para desativar o wrapper para depuração).

Os runners Docker de modelos live também montam por bind somente as homes de autenticação da CLI necessárias (ou todas as compatíveis quando a execução não é reduzida) e então as copiam para a home do contêiner antes da execução, para que OAuth de CLI externa possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; cobre Claude, Codex e Gemini por padrão, com cobertura estrita de Droid/OpenCode via `pnpm test:docker:live-acp-bind:droid` e `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke de harness de servidor de app do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smokes de observabilidade: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` e `pnpm qa:observability:smoke` são lanes privadas de checkout de origem de QA. Elas intencionalmente não fazem parte das lanes de release Docker de pacote porque o tarball npm omite o QA Lab.
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente do tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente o tarball empacotado do OpenClaw no Docker, configura OpenAI via onboarding com referência de env mais Telegram por padrão, executa doctor e executa um turno de agente OpenAI simulado. Reuse um tarball pré-criado com `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule o rebuild no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou altere o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ou `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke test da jornada do usuário de release: `pnpm test:docker:release-user-journey` instala o tarball empacotado do OpenClaw globalmente em um home limpo do Docker, executa o onboarding, configura um provedor OpenAI simulado, executa um turno de agente, instala/desinstala plugins externos, configura o ClickClack com uma fixture local, verifica mensagens de saída/entrada, reinicia o Gateway e executa o doctor.
- Smoke test de onboarding tipado de release: `pnpm test:docker:release-typed-onboarding` instala o tarball empacotado, conduz `openclaw onboard` por meio de um TTY real, configura OpenAI como um provedor env-ref, verifica que não há persistência de chave bruta e executa um turno de agente simulado.
- Smoke test de mídia/memória de release: `pnpm test:docker:release-media-memory` instala o tarball empacotado, verifica compreensão de imagem a partir de um anexo PNG, saída de geração de imagens compatível com OpenAI, recuperação de busca de memória e preservação da recuperação após reinicialização do Gateway.
- Smoke test da jornada do usuário de upgrade de release: `pnpm test:docker:release-upgrade-user-journey` instala por padrão a baseline publicada mais recente anterior ao tarball candidato, configura estado de provedor/plugin/ClickClack no pacote publicado, atualiza para o tarball candidato e então executa novamente a jornada principal de agente/plugin/canal. Se não existir uma baseline publicada anterior, ele reutiliza a versão candidata. Substitua a baseline com `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke test do marketplace de plugins de release: `pnpm test:docker:release-plugin-marketplace` instala a partir de um marketplace de fixture local, atualiza o plugin instalado, desinstala-o e verifica que a CLI do plugin desaparece com os metadados de instalação removidos.
- Smoke test de instalação de Skill: `pnpm test:docker:skill-install` instala o tarball empacotado do OpenClaw globalmente no Docker, desativa instalações de arquivos enviados na configuração, resolve o slug atual da Skill ativa do ClawHub pela busca, instala-a com `openclaw skills install` e verifica a Skill instalada junto com metadados de origem/bloqueio `.clawhub`.
- Smoke test de troca de canal de atualização: `pnpm test:docker:update-channel-switch` instala o tarball empacotado do OpenClaw globalmente no Docker, troca do pacote `stable` para git `dev`, verifica o canal persistido e o funcionamento do plugin pós-atualização, depois troca de volta para o pacote `stable` e confere o status de atualização.
- Smoke test de sobrevivente de upgrade: `pnpm test:docker:upgrade-survivor` instala o tarball empacotado do OpenClaw sobre uma fixture suja de usuário antigo com agentes, configuração de canal, allowlists de plugins, estado obsoleto de dependências de plugins e arquivos existentes de workspace/sessão. Ele executa atualização do pacote mais doctor não interativo sem provedor ativo nem chaves de canal, então inicia um Gateway local loopback e verifica preservação de configuração/estado, além de limites de inicialização/status.
- Smoke test de sobrevivente de upgrade publicado: `pnpm test:docker:published-upgrade-survivor` instala `openclaw@latest` por padrão, semeia arquivos realistas de usuário existente, configura essa baseline com uma receita de comandos embutida, valida a configuração resultante, atualiza essa instalação publicada para o tarball candidato, executa doctor não interativo, grava `.artifacts/upgrade-survivor/summary.json`, então inicia um Gateway local loopback e verifica intenções configuradas, preservação de estado, inicialização, `/healthz`, `/readyz` e limites de status RPC. Substitua uma baseline com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, peça ao agendador agregado para expandir baselines locais exatas com `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, e expanda fixtures em formato de issue com `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, como `reported-issues`; o conjunto `reported-issues` inclui `configured-plugin-installs` para reparo automático de instalação de plugin externo do OpenClaw. Aceitação de Pacote expõe isso como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, resolve tokens de meta-baseline como `last-stable-4` ou `all-since-2026.4.23`, e Validação Completa de Release expande o gate do pacote release-soak para `last-stable-4 2026.4.23 2026.5.2 2026.4.15` mais `reported-issues`.
- Smoke test de contexto de runtime de sessão: `pnpm test:docker:session-runtime-context` verifica a persistência oculta da transcrição de contexto de runtime mais o reparo pelo doctor de ramificações duplicadas afetadas de reescrita de prompt.
- Smoke test de instalação global com Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala-a com `bun install -g` em um home isolado e verifica que `openclaw infer image providers --json` retorna provedores de imagem embutidos em vez de travar. Reutilize um tarball pré-compilado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a compilação no host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test de instalador Docker: `bash scripts/test-install-sh-docker.sh` compartilha um cache npm entre seus contêineres root, update e direct-npm. O smoke test de atualização usa por padrão npm `latest` como baseline estável antes de atualizar para o tarball candidato. Substitua com `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` localmente, ou com a entrada `update_baseline_version` do workflow Install Smoke no GitHub. Verificações de instalador sem root mantêm um cache npm isolado para que entradas de cache pertencentes ao root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em novas execuções locais.
- A CI de Install Smoke pula a atualização global direct-npm duplicada com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem essa env quando cobertura direta de `npm install -g` for necessária.
- Smoke test da CLI de exclusão de agentes com workspace compartilhado: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) compila por padrão a imagem do Dockerfile raiz, semeia dois agentes com um workspace em um home de contêiner isolado, executa `agents delete --json` e verifica JSON válido mais comportamento de workspace preservado. Reutilize a imagem install-smoke com `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Rede do Gateway (dois contêineres, autenticação WS + saúde): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test de snapshot de CDP do navegador: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) compila a imagem E2E de origem mais uma camada Chromium, inicia o Chromium com CDP bruto, executa `browser doctor --deep` e verifica que snapshots de função CDP cobrem URLs de links, elementos clicáveis promovidos por cursor, refs de iframe e metadados de frame.
- Regressão de raciocínio mínimo de web_search do OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI simulado por meio do Gateway, verifica que `web_search` eleva `reasoning.effort` de `minimal` para `low`, então força a rejeição pelo schema do provedor e confere que o detalhe bruto aparece nos logs do Gateway.
- Ponte de canal MCP (Gateway semeado + ponte stdio + smoke test de frame de notificação bruto do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do bundle OpenClaw (servidor MCP stdio real + smoke test de permitir/negar do perfil OpenClaw embutido): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Limpeza MCP de Cron/subagente (Gateway real + encerramento de filho MCP stdio após execuções isoladas de Cron e de subagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke test de instalação/atualização para caminho local, `file:`, registro npm com dependências elevadas, metadados de pacote npm malformados, refs móveis de git, kitchen-sink do ClawHub, atualizações de marketplace e habilitação/inspeção do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para pular o bloco ClawHub, ou substitua o par padrão de pacote/runtime kitchen-sink com `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` e `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Sem `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, o teste usa um servidor de fixture local hermético do ClawHub.
- Smoke test de atualização de plugin inalterado: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test da matriz de ciclo de vida de plugins: `pnpm test:docker:plugin-lifecycle-matrix` instala o tarball empacotado do OpenClaw em um contêiner limpo, instala um plugin npm, alterna habilitar/desabilitar, faz upgrade e downgrade por meio de um registro npm local, exclui o código instalado e então verifica que a desinstalação ainda remove o estado obsoleto enquanto registra métricas de RSS/CPU para cada fase do ciclo de vida.
- Smoke test de metadados de recarregamento de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` cobre smoke test de instalação/atualização para caminho local, `file:`, registro npm com dependências elevadas, refs móveis de git, fixtures do ClawHub, atualizações de marketplace e habilitação/inspeção do bundle Claude. `pnpm test:docker:plugin-update` cobre o comportamento de atualização inalterada para plugins instalados. `pnpm test:docker:plugin-lifecycle-matrix` cobre instalação, habilitação, desabilitação, upgrade, downgrade e desinstalação com código ausente de plugin npm com recursos monitorados.

Para pré-compilar e reutilizar manualmente a imagem funcional compartilhada:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts fazem pull dela se ela ainda não estiver local. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação em vez do runtime compartilhado do aplicativo compilado.

Os runners Docker de modelos ao vivo também montam o checkout atual como somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem
de runtime enxuta, enquanto ainda executa o Vitest contra o seu código-fonte/config
local exato.
A etapa de preparação ignora caches grandes apenas locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios de saída `.build`
locais de apps ou do Gradle, para que execuções Docker ao vivo não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas ao vivo do gateway não iniciem
workers de canal reais de Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse também
`OPENCLAW_LIVE_GATEWAY_*` quando você precisar restringir ou excluir a cobertura
ao vivo do gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner de gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixado do Open WebUI contra esse gateway, faz login pelo
Open WebUI, verifica que `/api/models` expõe `openclaw/default` e então envia uma
solicitação de chat real pelo proxy `/api/chat/completions` do Open WebUI.
Defina `OPENWEBUI_SMOKE_MODE=models` para verificações de CI do caminho de release que devem parar
após o login no Open WebUI e a descoberta de modelos, sem aguardar uma conclusão de modelo
ao vivo.
A primeira execução pode ser perceptivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de inicialização a frio.
Esta lane espera uma chave de modelo ao vivo utilizável. Forneça-a pelo ambiente do processo,
por perfis de autenticação preparados ou por um `OPENCLAW_PROFILE_FILE` explícito.
Execuções bem-sucedidas imprimem uma pequena carga JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicializa um contêiner Gateway
semeado, inicia um segundo contêiner que cria `openclaw mcp serve` e então
verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexos,
comportamento da fila de eventos ao vivo, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos, para que o smoke valide o que a
ponte realmente emite, não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:agent-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo
ao vivo. Ele cria a imagem Docker do repo, inicia um servidor de sonda MCP stdio real
dentro do contêiner, materializa esse servidor pelo runtime MCP do pacote OpenClaw
embutido, executa a ferramenta e então verifica que `coding` e `messaging` mantêm
as ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo
ao vivo. Ele inicia um Gateway semeado com um servidor de sonda MCP stdio real, executa uma
rodada cron isolada e uma rodada filha one-shot `sessions_spawn`, e então verifica
que o processo filho MCP é encerrado após cada execução.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/debug. Ele pode ser necessário novamente para validação de roteamento de threads ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montado e carregado antes de executar testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem montagens externas de autenticação da CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação da CLI sob `$HOME` são montados como somente leitura sob `/host-auth...` e então copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfil (não do env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixada do Open WebUI

## Sanidade da documentação

Execute verificações de documentação após edições em docs: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando você também precisar de verificações de headings na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de "pipeline real" sem provedores reais:

- Chamada de ferramentas do Gateway (mock OpenAI, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente de configuração do Gateway (WS `wizard.start`/`wizard.next`, grava config + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade de agentes (skills)

Já temos alguns testes seguros para CI que se comportam como "evals de confiabilidade de agentes":

- Chamada de ferramentas mock pelo gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente de configuração que validam a fiação de sessão e efeitos de config (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/args obrigatórios?
- **Contratos de workflow:** cenários de múltiplos turnos que afirmam ordem de ferramentas, transporte do histórico de sessão e limites de sandbox.

Evals futuros devem permanecer determinísticos primeiro:

- Um executor de cenários usando provedores mock para afirmar chamadas de ferramentas + ordem, leituras de arquivos de skill e fiação de sessão.
- Uma pequena suíte de cenários focados em skill (usar vs evitar, gating, injeção de prompt).
- Evals ao vivo opcionais (opt-in, protegidos por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de Plugin e canal)

Testes de contrato verificam que cada Plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram por todos os plugins descobertos e executam uma suíte de
asserções de formato e comportamento. A lane unitária padrão `pnpm test` intencionalmente
ignora esses arquivos compartilhados de smoke e seam; execute os comandos de contrato explicitamente
quando você tocar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do Plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura da carga de mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ações de canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status de canal
- **registry** - Formato do registro de Plugin

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de Plugin
- **loader** - Carregamento de Plugin
- **runtime** - Runtime de provedor
- **shape** - Formato/interface de Plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exports ou subpaths do plugin-sdk
- Após adicionar ou modificar um Plugin de canal ou provedor
- Após refatorar registro ou descoberta de plugins

Testes de contrato rodam em CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrigir um problema de provedor/modelo descoberto ao vivo:

- Adicione uma regressão segura para CI se possível (provedor mock/stub, ou capture a transformação exata do formato da solicitação)
- Se for inerentemente apenas ao vivo (limites de taxa, políticas de autenticação), mantenha o teste ao vivo restrito e opt-in via variáveis de ambiente
- Prefira mirar na menor camada que capture o bug:
  - bug de conversão/replay de solicitação do provedor → teste direto de modelos
  - bug de sessão/histórico/pipeline de ferramentas do gateway → smoke ao vivo do gateway ou teste mock do gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um destino amostrado por classe SecretRef a partir de metadados de registro (`listSecretTargetRegistryEntries()`) e então afirma que ids exec com segmentos de travessia são rejeitados.
  - Se você adicionar uma nova família de destino SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de destino não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testes ao vivo](/pt-BR/help/testing-live)
- [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins)
- [CI](/pt-BR/ci)
