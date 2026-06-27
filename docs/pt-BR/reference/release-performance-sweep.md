---
read_when:
    - Você está validando a limpeza de desempenho e tamanho de pacote de maio de 2026
    - Você precisa dos números por trás da publicação do blog sobre desempenho e dependências do OpenClaw
    - Você está alterando gates de release, shrinkwrap de pacotes ou limites de dependências de plugins
summary: Resumo visual e evidências técnicas da limpeza de desempenho, tamanho do pacote, dependências e shrinkwrap de maio de 2026
title: Varredura de desempenho da versão
x-i18n:
    generated_at: "2026-06-27T18:09:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Esta página captura as evidências por trás da limpeza de desempenho, tamanho de pacote, dependências e shrinkwrap do OpenClaw em maio de 2026. Ela é o complemento técnico da publicação pública no blog.

Duas auditorias são combinadas aqui:

- **Varredura de desempenho da versão:** GitHub Releases de `v2026.5.28` até a
  estável `v2026.4.23`, usando o workflow `OpenClaw Performance`,
  `profile=smoke`, faixa mock-provider. A maioria das linhas de tags tem uma amostra; as
  linhas `v2026.5.27` e `v2026.5.28` usam os artefatos mais recentes da branch de release com repetição 3.
- **Contexto anterior de abril:** baselines mock-provider publicados em
  `clawgrit-reports` de `v2026.4.1` até `v2026.5.2`, usados apenas para evitar tratar
  as versões quebradas do fim de abril como a baseline pública de desempenho.
- **Varredura da pegada de instalação:** instalações novas com `npm install --ignore-scripts`
  em pacotes temporários, com `du -sk node_modules` para tamanho e uma
  varredura de `node_modules` para contagens de instâncias de pacotes.
- **Varredura do tamanho de pacote npm:** `npm pack openclaw@<version> --dry-run --json`
  para versões publicadas, registrando tamanho do tarball compactado, tamanho descompactado e
  contagem de arquivos.

<Warning>
A varredura principal de desempenho usa uma amostra smoke por tag, exceto as
linhas `v2026.5.27` e `v2026.5.28`, que usam os artefatos mais recentes da branch de release com repetição 3.
O contexto anterior de abril usa medianas de repetição 3 publicadas em
`clawgrit-reports`. Trate os números como evidência de tendência e
sinal para caça a regressões, não como estatísticas de gate de release.
</Warning>

## Snapshot

Cobertura de desempenho: **77 versões solicitadas**, **74 pontos respaldados por artefatos**
e **3 execuções de CI indisponíveis**. Ponto estável medido mais recente: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Turno estável do agente" icon="gauge">
    **Turno frio 5,1x mais rápido**

    - `v2026.4.14`: 9,8s
    - `v2026.5.28`: 1,9s

  </Card>
  <Card title="Pacote publicado" icon="package">
    **Tarball de 17,9 MB**

    Pacote estável mais recente, abaixo do pico de tamanho de pacote de março, de 43,3 MB.

  </Card>
  <Card title="Instalação estável mais recente" icon="hard-drive">
    **Instalação nova de 361,7 MiB**

    `v2026.5.28` reduz acentuadamente a árvore de dependências aninhada do OpenClaw, mas uma
    árvore aninhada menor de 259,7 MiB ainda permanece na auditoria local de instalação.

  </Card>
  <Card title="Grafo de dependências" icon="boxes">
    **300 pacotes instalados**

    Versão estável mais recente, medida como raízes únicas de nome/versão de pacote em uma
    instalação nova com scripts desativados.

  </Card>
</CardGroup>

## Linha do tempo da pegada de instalação

<CardGroup cols={2}>
  <Card title="Pico mensal" icon="triangle-alert">
    **645 dependências**

    `2026.2.26` foi o pico mensal de contagem de dependências nesta amostra.

  </Card>
  <Card title="Shrinkwrap introduzido" icon="lock">
    **Instalação de 1.020,6 MB**

    `2026.5.22` adicionou shrinkwrap raiz e expôs um problema de formato de pacote:
    911,8 MB ficaram sob `openclaw/node_modules` aninhado.

  </Card>
  <Card title="Estável mais recente" icon="tag">
    **Instalação de 361,7 MiB**

    `2026.5.28` reduz o tamanho da instalação nova em 52,8% em relação a `2026.5.27`, mas ainda
    instala uma árvore aninhada do OpenClaw de 259,7 MiB.

  </Card>
  <Card title="Grafo de dependências" icon="scissors">
    **300 raízes de pacotes**

    `2026.5.28` instala 71 raízes únicas de nome/versão de pacote a menos que
    `2026.5.27`.

  </Card>
</CardGroup>

<Tip>
Shrinkwrap não era o problema por si só. O formato ruim do pacote era.
`v2026.5.28` ainda envia shrinkwrap, mas a árvore de dependências aninhada é muito
menor e o fanout de canvas para todas as plataformas desapareceu na auditoria local.
</Tip>

## O Que Mudou Na 5.28

A limpeza entre `v2026.5.27` e `v2026.5.28` reduziu o grafo da instalação
padrão em vez de remover as capacidades em si.

<CardGroup cols={2}>
  <Card title="Root default graph" icon="git-branch">
    As raízes únicas de nome/versão de pacote caíram de **371** para **300**.
    As instâncias de pacote caíram de **372** para **301**.
  </Card>
  <Card title="Nested tree" icon="unplug">
    O `openclaw/node_modules` aninhado caiu de **656.1MiB** para **259.7MiB** na
    mesma auditoria de instalação local.
  </Card>
  <Card title="Native optional cones" icon="cpu">
    O cone de pacote nativo `@napi-rs/canvas` para todas as plataformas deixou
    de entrar na instalação padrão.
  </Card>
  <Card title="Supply-chain surface" icon="shield">
    Menos pacotes padrão significa menos tarballs, mantenedores, binários nativos,
    comportamentos no momento da instalação e caminhos de atualização transitivos
    para confiar por padrão.
  </Card>
</CardGroup>

## Números Principais

Não use as linhas quebradas do fim de abril como referências públicas de
desempenho. `v2026.4.23` e `v2026.4.29` são evidências úteis de regressão, mas
os grandes deltas no estilo `14x` descrevem principalmente a recuperação de uma
linha de release ruim.

Para a narrativa do blog, use a referência publicada no início de abril como
escala:

| Métrica              | Referência do início de abril | `v2026.5.28` |                         Delta |
| -------------------- | ----------------------------: | -----------: | ----------------------------: |
| Turn frio do agente  |                       9,819ms |      1,908ms | 80,6% menor, 5,1x mais rápido |
| Turn quente do agente |                       7,458ms |      1,870ms | 74,9% menor, 4,0x mais rápido |
| RSS de pico do agente |                       686.2MB |      581.0MB |                    15,3% menor |

A referência do início de abril é `v2026.4.14`, da execução publicada do
provedor mock em `clawgrit-reports`. Essa execução usou repetição 3 e falhou
apenas porque a linha do tempo diagnóstica não foi emitida; as medianas de frio,
quente e RSS ainda são úteis como escala aproximada. Trate isso como contexto
narrativo, não como uma estatística de gate de release.

Dentro da varredura de maio, a linha mais recente do branch de release avançou
materialmente desde `v2026.5.2`:

| Métrica              | `v2026.5.2` | `v2026.5.28` |       Delta |
| -------------------- | ----------: | -----------: | ----------: |
| Turn frio do agente  |     3,897ms |      1,908ms | 51,0% menor |
| Turn quente do agente |     3,610ms |      1,870ms | 48,2% menor |
| RSS de pico do agente |     613.7MB |      581.0MB |  5,3% menor |

Comparado com o release estável anterior:

| Métrica              | `v2026.5.27` | `v2026.5.28` |       Delta |
| -------------------- | -----------: | -----------: | ----------: |
| Turn frio do agente  |      2,231ms |      1,908ms | 14,5% menor |
| Turn quente do agente |      2,226ms |      1,870ms | 16,0% menor |
| RSS de pico do agente |      649.0MB |      581.0MB | 10,5% menor |

### Pegada de instalação

| Métrica                                             | Referência | `v2026.5.28` |       Delta |
| --------------------------------------------------- | ---------: | -----------: | ----------: |
| Tamanho da instalação desde o pico de `2026.5.22`   |  1,020.6MB |     361.7MiB | 64,6% menor |
| Tamanho da instalação desde o release mais recente `2026.5.27` |  767.1MiB |     361.7MiB | 52,8% menor |
| Dependências desde a máxima mensal `2026.2.26`      |        645 |          300 | 53,5% menor |
| Dependências desde o release mais recente `2026.5.27` |       371 |          300 | 19,1% menor |
| `openclaw/node_modules` aninhado desde `2026.5.22`  |    911.8MB |     259.7MiB | 71,5% menor |
| `openclaw/node_modules` aninhado desde `2026.5.27`  |   656.1MiB |     259.7MiB | 60,4% menor |

### Tamanho do pacote npm

| Versão      | Tarball compactado | Pacote descompactado | Arquivos | Observações                                  |
| ----------- | -----------------: | -------------------: | -------: | ------------------------------------------- |
| `2026.1.30` |             12.8MB |               33.5MB |    4,607 | pacote inicial com rebranding               |
| `2026.2.26` |             23.6MB |               82.9MB |   10,125 | crescimento de recursos                     |
| `2026.3.31` |             43.3MB |              182.6MB |   21,037 | ponto máximo de tamanho do pacote           |
| `2026.4.29` |             22.9MB |               74.6MB |    9,309 | poda do pacote visível                      |
| `2026.5.12` |             23.4MB |               80.1MB |   12,035 | grande separação de Plugin externo          |
| `2026.5.22` |             17.2MB |               76.9MB |   12,386 | docs/assets excluídos do pacote             |
| `2026.5.27` |             17.8MB |               79.0MB |   12,509 | pacote estável anterior                     |
| `2026.5.28` |             17.9MB |               81.0MB |    9,082 | pacote estável mais recente                 |

`2026.5.12` é o marco visível de extração de plugins no changelog: Amazon
Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex, Matrix e
WhatsApp saíram do caminho de dependências do core, para que seus cones de
dependência sejam instalados com esses plugins em vez de em toda instalação do
core.

## Resumo de turn do agente Kova

A linha estável de abril contém duas histórias diferentes. O início de abril era
lento, mas reconhecível. O fim de abril virou um precipício de regressão.
`v2026.5.2` é onde a faixa do provedor mock primeiro cai para o intervalo de 3 a
5s e começa a passar de forma consistente na varredura fornecida.

Contexto publicado anterior:

| Release      | Kova   | Turn frio | Turn quente | RSS de pico do agente |
| ------------ | ------ | --------: | -----------: | --------------------: |
| `v2026.4.10` | FALHOU |  11,031ms |      7,962ms |               679.0MB |
| `v2026.4.12` | FALHOU |  11,965ms |      8,289ms |               713.5MB |
| `v2026.4.14` | FALHOU |   9,819ms |      7,458ms |               686.2MB |
| `v2026.4.20` | FALHOU |  22,314ms |     18,811ms |               810.8MB |
| `v2026.4.22` | FALHOU |   9,630ms |      7,459ms |               743.0MB |

Varredura fornecida:

| Release             | Kova   | Turn frio | Turn quente | RSS de pico do agente |
| ------------------- | ------ | --------: | -----------: | --------------------: |
| `v2026.4.23`        | FALHOU |  47,847ms |      8,010ms |             1,082.7MB |
| `v2026.4.24`        | FALHOU |  48,264ms |     25,483ms |               996.0MB |
| `v2026.4.25`        | FALHOU |  81,080ms |     59,172ms |             1,113.9MB |
| `v2026.4.26`        | FALHOU |  76,771ms |     54,941ms |             1,140.8MB |
| `v2026.4.27`        | FALHOU |  60,902ms |     33,699ms |             1,156.0MB |
| `v2026.4.29`        | FALHOU |  94,031ms |     57,334ms |             3,613.7MB |
| `v2026.5.2`         | PASSOU |   3,897ms |      3,610ms |               613.7MB |
| `v2026.5.7`         | PASSOU |   3,923ms |      3,693ms |               654.1MB |
| `v2026.5.12`        | PASSOU |   7,248ms |      6,629ms |               834.8MB |
| `v2026.5.18`        | PASSOU |   3,301ms |      2,913ms |               630.3MB |
| `v2026.5.20`        | PASSOU |   3,413ms |      2,952ms |               643.2MB |
| `v2026.5.22`        | PASSOU |   4,494ms |      4,093ms |               654.3MB |
| `v2026.5.26`        | PASSOU |   2,626ms |      2,282ms |               660.4MB |
| `v2026.5.27-beta.1` | PASSOU |   2,575ms |      2,217ms |               635.3MB |
| `v2026.5.27`        | PASSOU |   2,231ms |      2,226ms |               649.0MB |
| `v2026.5.28`        | PASSOU |   1,908ms |      1,870ms |               581.0MB |

## Probes de origem

Os probes de origem foram ignorados para 17 refs antigas bem-sucedidas porque
essas árvores de origem ainda não tinham os pontos de entrada de probe
necessários. As métricas de turn de agente ainda existem para essas refs.

Pontos representativos de probe de origem:

| Release             | `readyz` padrão p50 | `readyz` com 50 plugins p50 | Saúde da CLI p50 | RSS máx. do Plugin |
| ------------------- | ------------------: | --------------------------: | ---------------: | ------------------: |
| `v2026.4.29`        |             2,819ms |                     2,618ms |          1,679ms |             389.0MB |
| `v2026.5.2`         |             2,324ms |                     2,013ms |          1,384ms |             377.2MB |
| `v2026.5.7`         |             1,649ms |                     1,540ms |          1,175ms |             387.6MB |
| `v2026.5.18`        |             1,942ms |                     1,927ms |            607ms |             426.5MB |
| `v2026.5.20`        |             1,966ms |                     1,987ms |            621ms |             455.0MB |
| `v2026.5.22`        |             2,081ms |                     1,884ms |          5,095ms |             444.2MB |
| `v2026.5.26`        |             1,546ms |                     1,634ms |            656ms |             400.4MB |
| `v2026.5.27-beta.1` |             1,462ms |                     1,548ms |            548ms |             394.0MB |
| `v2026.5.27`        |             1,491ms |                     1,571ms |            553ms |             401.5MB |
| `v2026.5.28`        |             1,457ms |                     1,474ms |            623ms |             386.1MB |

O pico de integridade da CLI `v2026.5.22` fica visível nesta tabela, embora a
lane agent-turn ainda tenha passado. Mantenha as sondagens de origem ao investigar
regressões direcionadas da CLI ou do Gateway.

## Auditoria do footprint de instalação

As amostras de dependências usam uma versão estável por mês, além do evento de
introdução do shrinkwrap em `2026.5.22` e da versão mais recente `2026.5.28`.

| Ponto              | Dependências instaladas | Instalação nova | Pacote OpenClaw | `openclaw/node_modules` aninhado | Shrinkwrap raiz | Comportamento de instalação do Canvas     |
| ------------------ | ----------------------: | --------------: | ---------------: | -------------------------------: | --------------- | ----------------------------------------- |
| Jan `2026.1.30`    |                     605 |         438.4MB |           45.8MB |                            2.4MB | não             | wrapper de nível superior + `darwin-arm64` |
| Fev `2026.2.26`    |                     645 |         575.7MB |          110.1MB |                            3.5MB | não             | wrapper de nível superior + `darwin-arm64` |
| Mar `2026.3.31`    |                     438 |         584.1MB |          234.8MB |                              0MB | não             | wrapper de nível superior + `darwin-arm64` |
| Abr `2026.4.29`    |                     392 |         335.0MB |           97.4MB |                              0MB | não             | nenhum instalado                          |
| `2026.5.22`        |                     401 |       1,020.6MB |        1,020.4MB |                          911.8MB | sim             | aninhado: todos os 12 pacotes `@napi-rs/canvas` |
| Maio `2026.5.26`   |                     371 |         767.5MB |          767.4MB |                          656.4MB | sim             | aninhado: todos os 12 pacotes `@napi-rs/canvas` |
| `2026.5.27`        |                     371 |        767.1MiB |         766.9MiB |                         656.1MiB | sim             | aninhado: todos os 12 pacotes `@napi-rs/canvas` |
| Mais recente `2026.5.28` |               300 |        361.7MiB |         361.6MiB |                         259.7MiB | sim             | nenhum instalado                          |

### Limite do shrinkwrap

<CardGroup cols={2}>
  <Card title="Before shrinkwrap" icon="unlock">
    `2026.5.20` não tem shrinkwrap raiz nem uma grande árvore aninhada de
    dependências do OpenClaw.
  </Card>
  <Card title="Introduced" icon="lock">
    `2026.5.22` adiciona shrinkwrap raiz e instala 911.8MB sob
    `openclaw/node_modules` aninhado.
  </Card>
  <Card title="Latest stable" icon="tag">
    `2026.5.28` mantém o shrinkwrap e ainda instala 259.7MiB sob
    `openclaw/node_modules` aninhado.
  </Card>
  <Card title="Canvas fanout fixed" icon="check">
    `2026.5.28` não instala mais nenhum pacote `@napi-rs/canvas` na auditoria
    local de instalação nova.
  </Card>
</CardGroup>

A inspeção do tarball publicado verifica o limite:

| Versão      | Estável publicado? | `npm-shrinkwrap.json` raiz | Observações                           |
| ----------- | ------------------ | -------------------------- | ------------------------------------- |
| `2026.5.20` | sim                | não                        | última versão estável antes do shrinkwrap |
| `2026.5.21` | não                | n/d                        | nenhuma versão npm estável            |
| `2026.5.22` | sim                | sim                        | shrinkwrap introduzido                |
| `2026.5.23` | não                | n/d                        | nenhuma versão npm estável            |
| `2026.5.24` | não                | n/d                        | nenhuma versão npm estável            |
| `2026.5.25` | não                | n/d                        | nenhuma versão npm estável            |
| `2026.5.26` | sim                | sim                        | árvore de dependências aninhada ainda presente |
| `2026.5.27` | sim                | sim                        | árvore de dependências aninhada ainda presente |
| `2026.5.28` | sim                | sim                        | árvore de dependências aninhada muito menor |

A distinção importante: **o shrinkwrap em si não é o problema**.
`v2026.5.28` ainda distribui shrinkwrap raiz. O problema era o formato do pacote
que fazia o npm materializar uma grande árvore aninhada de dependências do OpenClaw
e todos os 12 pacotes de plataforma `@napi-rs/canvas`. A árvore aninhada é menor
em `v2026.5.28`, e o fanout de plataformas do canvas não aparece mais na auditoria
local.

Para uma explicação em linguagem simples sobre shrinkwrap e as verificações de
pacote em nível de mantenedor, consulte [npm shrinkwrap](/pt-BR/gateway/security/shrinkwrap).

## Interpretação de cadeia de suprimentos

A contagem de dependências é uma métrica de segurança operacional, não apenas uma
métrica de tamanho de instalação. Cada pacote amplia o conjunto de mantenedores,
tarballs, atualizações transitivas, binários nativos opcionais e comportamentos em
tempo de instalação que os operadores precisam confiar.

A direção da limpeza é:

- manter recursos pesados e opcionais fora da instalação padrão do core
- fazer os pacotes de Plugin serem donos do próprio grafo de dependências em runtime
- evitar reparo de gerenciador de pacotes em runtime durante a inicialização do Gateway
- preservar instalações determinísticas sem causar materialização de pacotes nativos
  para todas as plataformas
- manter scripts de instalação desabilitados nos caminhos de aceitação e medição de pacotes
- detectar árvores de dependências aninhadas e explosões de dependências opcionais nativas antes
  da publicação

Documentos relacionados:

- [Resolução de dependências de Plugin](/pt-BR/plugins/dependency-resolution)
- [Inventário de Plugins](/pt-BR/plugins/plugin-inventory)
- [Validação completa de release](/pt-BR/reference/full-release-validation)
