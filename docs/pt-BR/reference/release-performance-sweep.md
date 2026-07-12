---
read_when:
    - Você está validando a limpeza de desempenho e tamanho do pacote de maio de 2026
    - Você precisa dos números por trás da publicação do blog sobre desempenho e dependências do OpenClaw
    - Você está alterando os critérios de liberação, o shrinkwrap de pacotes ou os limites de dependência de plugins
summary: Resumo visual e evidências técnicas da limpeza de desempenho, tamanho de pacote, dependências e shrinkwrap de maio de 2026
title: Revisão de desempenho da versão
x-i18n:
    generated_at: "2026-07-12T15:36:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Esta página reúne as evidências por trás da limpeza de desempenho, tamanho de
pacote, dependências e shrinkwrap do OpenClaw em maio de 2026. Ela é o complemento
técnico da publicação pública no blog.

Duas auditorias são combinadas aqui:

- **Varredura de desempenho das versões:** GitHub Releases de `v2026.5.28` até
  a versão estável `v2026.4.23`, usando o workflow `OpenClaw Performance`,
  `profile=smoke` e a faixa de provedor simulado. A maioria das linhas de tags
  contém uma amostra; as linhas `v2026.5.27` e `v2026.5.28` usam os artefatos
  mais recentes de três repetições da branch de versão.
- **Contexto anterior de abril:** linhas de base publicadas do provedor simulado
  em `clawgrit-reports`, de `v2026.4.1` a `v2026.5.2`, usadas apenas para evitar
  tratar as versões problemáticas do fim de abril como a linha de base pública
  de desempenho.
- **Varredura da ocupação da instalação:** instalações novas com
  `npm install --ignore-scripts` em pacotes temporários, usando
  `du -sk node_modules` para o tamanho e uma varredura de `node_modules` para
  contar instâncias de pacotes.
- **Varredura do tamanho do pacote npm:** `npm pack openclaw@<version> --dry-run --json`
  para versões publicadas, registrando o tamanho do tarball compactado, o tamanho
  descompactado e a quantidade de arquivos.

<Warning>
A principal varredura de desempenho usa uma amostra smoke por tag, exceto nas
linhas `v2026.5.27` e `v2026.5.28`, que usam os artefatos mais recentes de três
repetições da branch de versão. O contexto anterior de abril usa medianas
publicadas de três repetições de `clawgrit-reports`. Trate os números como
evidência de tendência e sinal para investigação de regressões, não como
estatísticas de gate de versão.
</Warning>

## Resumo

Cobertura de desempenho: **77 versões solicitadas**, **74 pontos respaldados por
artefatos** e **3 execuções de CI indisponíveis**. Ponto mais recente medido de
uma versão estável: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Turno estável do agente" icon="gauge">
    **Turno frio 5,1x mais rápido**

    - `v2026.4.14`: 9,8s
    - `v2026.5.28`: 1,9s

  </Card>
  <Card title="Pacote publicado" icon="package">
    **Tarball de 17,9MB**

    Pacote estável mais recente, abaixo do pico de tamanho de 43,3MB registrado em março.

  </Card>
  <Card title="Instalação estável mais recente" icon="hard-drive">
    **Instalação nova de 361,7MiB**

    Reduz drasticamente a árvore aninhada de dependências do OpenClaw em relação
    ao pico da introdução do shrinkwrap em `2026.5.22`, embora uma árvore
    aninhada menor, de 259,7MiB, ainda permaneça na auditoria de instalação local.

  </Card>
  <Card title="Grafo de dependências" icon="boxes">
    **300 pacotes instalados**

    Medidos como raízes únicas de nome/versão de pacote em uma instalação nova
    com scripts desabilitados; 71 raízes a menos que na versão estável anterior.

  </Card>
</CardGroup>

## O que mudou na 5.28

A limpeza entre `v2026.5.27` e `v2026.5.28` reduziu o grafo da instalação
padrão, em vez de remover as próprias funcionalidades.

<CardGroup cols={2}>
  <Card title="Grafo padrão da raiz" icon="git-branch">
    As raízes únicas de nome/versão de pacote caíram de **371** para **300**.
    As instâncias de pacotes caíram de **372** para **301**.
  </Card>
  <Card title="Árvore aninhada" icon="unplug">
    O `openclaw/node_modules` aninhado caiu de **656,1MiB** para **259,7MiB** na
    mesma auditoria de instalação local.
  </Card>
  <Card title="Cones opcionais nativos" icon="cpu">
    O cone de pacotes nativos para todas as plataformas de `@napi-rs/canvas`
    deixou de ser incluído na instalação padrão.
  </Card>
  <Card title="Superfície da cadeia de suprimentos" icon="shield">
    Menos pacotes padrão significam menos tarballs, mantenedores, binários
    nativos, comportamentos durante a instalação e caminhos de atualização
    transitivos nos quais confiar por padrão.
  </Card>
</CardGroup>

<Tip>
O shrinkwrap não era o problema por si só. O problema era a estrutura
inadequada do pacote. `v2026.5.28` ainda inclui shrinkwrap, mas a árvore aninhada
de dependências é muito menor e a distribuição do canvas para todas as
plataformas não aparece mais na auditoria local.
</Tip>

## Números principais

Não use as linhas problemáticas do fim de abril como linhas de base públicas de
desempenho. `v2026.4.23` e `v2026.4.29` são evidências úteis de regressão, mas
as grandes diferenças da ordem de `14x` descrevem principalmente a recuperação
de uma sequência de versões problemáticas.

Para a narrativa do blog, use como escala a linha de base publicada do início
de abril. A linha de base é `v2026.4.14`, proveniente da execução publicada com
provedor simulado em `clawgrit-reports` (3 repetições; essa execução falhou
apenas porque a linha do tempo de diagnóstico não foi emitida, portanto as
medianas de execução fria, quente e RSS ainda são úteis como escala aproximada).
Trate isso como contexto narrativo, não como estatística de gate de versão.

| Métrica         | Linha de base do início de abril | `v2026.5.28` |                     Diferença |
| --------------- | --------------------------------: | -----------: | ----------------------------: |
| Turno frio do agente |                         9,819ms |      1,908ms | 80,6% menor, 5,1x mais rápido |
| Turno quente do agente |                       7,458ms |      1,870ms | 74,9% menor, 4,0x mais rápido |
| Pico de RSS do agente |                         686,2MB |      581,0MB |                   15,3% menor |

Na varredura de maio, a linha mais recente da branch de versão teve uma mudança
significativa em relação a `v2026.5.2`:

| Métrica         | `v2026.5.2` | `v2026.5.28` | Diferença |
| --------------- | ----------: | -----------: | --------: |
| Turno frio do agente |     3,897ms |      1,908ms | 51,0% menor |
| Turno quente do agente |   3,610ms |      1,870ms | 48,2% menor |
| Pico de RSS do agente |     613,7MB |      581,0MB |  5,3% menor |

Em comparação com a versão estável anterior:

| Métrica         | `v2026.5.27` | `v2026.5.28` | Diferença |
| --------------- | -----------: | -----------: | --------: |
| Turno frio do agente |      2,231ms |      1,908ms | 14,5% menor |
| Turno quente do agente |    2,226ms |      1,870ms | 16,0% menor |
| Pico de RSS do agente |      649,0MB |      581,0MB | 10,5% menor |

### Ocupação da instalação

| Métrica                                         | Linha de base | `v2026.5.28` | Diferença |
| ----------------------------------------------- | ------------: | -----------: | --------: |
| Tamanho da instalação desde o pico de `2026.5.22` |     1,020.6MB |     361.7MiB | 64,6% menor |
| Tamanho da instalação desde a versão mais recente `2026.5.27` | 767.1MiB | 361.7MiB | 52,8% menor |
| Dependências desde o pico mensal de `2026.2.26` |           645 |          300 | 53,5% menor |
| Dependências desde a versão mais recente `2026.5.27` |       371 |          300 | 19,1% menor |
| `openclaw/node_modules` aninhado desde `2026.5.22` |     911.8MB |     259.7MiB | 71,5% menor |
| `openclaw/node_modules` aninhado desde `2026.5.27` |   656.1MiB |     259.7MiB | 60,4% menor |

### Tamanho do pacote npm

| Versão      | Tarball compactado | Pacote descompactado | Arquivos | Observações                                  |
| ----------- | ------------------: | -------------------: | -------: | -------------------------------------------- |
| `2026.1.30` |              12.8MB |               33.5MB |    4,607 | pacote inicial após a mudança de marca       |
| `2026.2.26` |              23.6MB |               82.9MB |   10,125 | crescimento de funcionalidades               |
| `2026.3.31` |              43.3MB |              182.6MB |   21,037 | pico do tamanho do pacote                    |
| `2026.4.29` |              22.9MB |               74.6MB |    9,309 | redução do pacote visível                    |
| `2026.5.12` |              23.4MB |               80.1MB |   12,035 | grande separação de plugins externos         |
| `2026.5.22` |              17.2MB |               76.9MB |   12,386 | documentação/recursos excluídos do pacote    |
| `2026.5.27` |              17.8MB |               79.0MB |   12,509 | pacote estável anterior                      |
| `2026.5.28` |              17.9MB |               81.0MB |    9,082 | pacote estável mais recente                  |

`2026.5.12` é o marco visível da extração de plugins no changelog:
Amazon Bedrock, Bedrock Mantle, Slack, sandbox OpenShell, Anthropic Vertex,
Matrix e WhatsApp foram removidos do caminho de dependências do núcleo, para que
seus cones de dependências sejam instalados com esses plugins, em vez de em
todas as instalações do núcleo.

## Resumo dos turnos do agente Kova

A sequência estável de abril contém duas histórias diferentes. O início de abril
era lento, mas reconhecível. O fim de abril tornou-se um abismo de regressão.
`v2026.5.2` é o ponto em que a faixa de provedor simulado entra pela primeira
vez no intervalo de 3 a 5s e começa a passar consistentemente na varredura
fornecida.

Contexto publicado anteriormente:

| Versão       | Kova | Turno frio | Turno quente | Pico de RSS do agente |
| ------------ | ---- | ---------: | ------------: | --------------------: |
| `v2026.4.10` | FALHA |  11,031ms |       7,962ms |               679.0MB |
| `v2026.4.12` | FALHA |  11,965ms |       8,289ms |               713.5MB |
| `v2026.4.14` | FALHA |   9,819ms |       7,458ms |               686.2MB |
| `v2026.4.20` | FALHA |  22,314ms |      18,811ms |               810.8MB |
| `v2026.4.22` | FALHA |   9,630ms |       7,459ms |               743.0MB |

Varredura fornecida:

| Versão              | Kova | Turno frio | Turno quente | Pico de RSS do agente |
| ------------------- | ---- | ---------: | ------------: | --------------------: |
| `v2026.4.23`        | FALHA |  47,847ms |       8,010ms |             1,082.7MB |
| `v2026.4.24`        | FALHA |  48,264ms |      25,483ms |               996.0MB |
| `v2026.4.25`        | FALHA |  81,080ms |      59,172ms |             1,113.9MB |
| `v2026.4.26`        | FALHA |  76,771ms |      54,941ms |             1,140.8MB |
| `v2026.4.27`        | FALHA |  60,902ms |      33,699ms |             1,156.0MB |
| `v2026.4.29`        | FALHA |  94,031ms |      57,334ms |             3,613.7MB |
| `v2026.5.2`         | APROVADO |   3,897ms |       3,610ms |               613.7MB |
| `v2026.5.7`         | APROVADO |   3,923ms |       3,693ms |               654.1MB |
| `v2026.5.12`        | APROVADO |   7,248ms |       6,629ms |               834.8MB |
| `v2026.5.18`        | APROVADO |   3,301ms |       2,913ms |               630.3MB |
| `v2026.5.20`        | APROVADO |   3,413ms |       2,952ms |               643.2MB |
| `v2026.5.22`        | APROVADO |   4,494ms |       4,093ms |               654.3MB |
| `v2026.5.26`        | APROVADO |   2,626ms |       2,282ms |               660.4MB |
| `v2026.5.27-beta.1` | APROVADO |   2,575ms |       2,217ms |               635.3MB |
| `v2026.5.27`        | APROVADO |   2,231ms |       2,226ms |               649.0MB |
| `v2026.5.28`        | APROVADO |   1,908ms |       1,870ms |               581.0MB |

## Sondagens do código-fonte

As sondagens do código-fonte foram ignoradas em 17 referências antigas
bem-sucedidas porque essas árvores de código-fonte ainda não tinham os pontos
de entrada de sondagem necessários. Ainda existem métricas de turnos do agente
para essas referências.

Pontos representativos de sondagem do código-fonte:

| Versão              | `readyz` padrão p50 | `readyz` com 50 plugins p50 | Saúde da CLI p50 | RSS máximo de plugins |
| ------------------- | ------------------: | --------------------------: | -----------------: | --------------------: |
| `v2026.4.29`        |             2,819ms |                     2,618ms |            1,679ms |               389.0MB |
| `v2026.5.2`         |             2,324ms |                     2,013ms |            1,384ms |               377.2MB |
| `v2026.5.7`         |             1,649ms |                     1,540ms |            1,175ms |               387.6MB |
| `v2026.5.18`        |             1,942ms |                     1,927ms |              607ms |               426.5MB |
| `v2026.5.20`        |             1,966ms |                     1,987ms |              621ms |               455.0MB |
| `v2026.5.22`        |             2,081ms |                     1,884ms |            5,095ms |               444.2MB |
| `v2026.5.26`        |             1,546ms |                     1,634ms |              656ms |               400.4MB |
| `v2026.5.27-beta.1` |             1,462ms |                     1,548ms |              548ms |               394.0MB |
| `v2026.5.27`        |             1,491ms |                     1,571ms |              553ms |               401.5MB |
| `v2026.5.28`        |             1,457ms |                     1,474ms |              623ms |               386.1MB |

O pico de saúde da CLI em `v2026.5.22` aparece nesta tabela, embora a faixa de
turnos do agente ainda tenha sido aprovada. Mantenha as sondagens do código-fonte
ao investigar regressões específicas da CLI ou do gateway.

## Auditoria da ocupação da instalação

As amostras de dependências usam uma versão estável por mês, além do evento de
introdução do shrinkwrap em `2026.5.22` e da versão mais recente, `2026.5.28`.

| Ponto              | Deps instaladas | Instalação limpa | Pacote OpenClaw | `openclaw/node_modules` aninhado | Shrinkwrap raiz | Comportamento de instalação do Canvas                  |
| ------------------ | --------------: | ---------------: | --------------: | --------------------------------: | --------------- | ------------------------------------------------------ |
| Jan `2026.1.30`    |             605 |          438.4MB |          45.8MB |                             2.4MB | não             | wrapper de nível superior + `darwin-arm64`             |
| Fev `2026.2.26`    |             645 |          575.7MB |         110.1MB |                             3.5MB | não             | wrapper de nível superior + `darwin-arm64`             |
| Mar `2026.3.31`    |             438 |          584.1MB |         234.8MB |                               0MB | não             | wrapper de nível superior + `darwin-arm64`             |
| Abr `2026.4.29`    |             392 |          335.0MB |          97.4MB |                               0MB | não             | nenhum instalado                                      |
| `2026.5.22`        |             401 |        1,020.6MB |       1,020.4MB |                           911.8MB | sim             | aninhado: todos os 12 pacotes `@napi-rs/canvas`        |
| Mai `2026.5.26`    |             371 |          767.5MB |         767.4MB |                           656.4MB | sim             | aninhado: todos os 12 pacotes `@napi-rs/canvas`        |
| `2026.5.27`        |             371 |         767.1MiB |        766.9MiB |                          656.1MiB | sim             | aninhado: todos os 12 pacotes `@napi-rs/canvas`        |
| Mais recente `2026.5.28` |       300 |         361.7MiB |        361.6MiB |                          259.7MiB | sim             | nenhum instalado                                      |

### Limite do shrinkwrap

A versão `2026.5.20` foi lançada sem shrinkwrap raiz e sem uma grande árvore
aninhada de dependências do OpenClaw. A versão `2026.5.22` introduziu o
shrinkwrap raiz e instalou 911.8MB em `openclaw/node_modules` aninhado. A versão
`2026.5.28` mantém o shrinkwrap e ainda instala 259.7MiB em
`openclaw/node_modules` aninhado, mas já não instala nenhum pacote
`@napi-rs/canvas` na auditoria local de instalação limpa.

A inspeção dos tarballs publicados confirma o limite:

| Versão      | Estável publicada? | `npm-shrinkwrap.json` raiz | Observações                                            |
| ----------- | ------------------ | -------------------------- | ------------------------------------------------------ |
| `2026.5.20` | sim                | não                        | última versão estável antes do shrinkwrap              |
| `2026.5.21` | não                | n/d                        | nenhuma versão estável no npm                          |
| `2026.5.22` | sim                | sim                        | shrinkwrap introduzido                                 |
| `2026.5.23` | não                | n/d                        | nenhuma versão estável no npm                          |
| `2026.5.24` | não                | n/d                        | nenhuma versão estável no npm                          |
| `2026.5.25` | não                | n/d                        | nenhuma versão estável no npm                          |
| `2026.5.26` | sim                | sim                        | árvore aninhada de dependências ainda presente         |
| `2026.5.27` | sim                | sim                        | árvore aninhada de dependências ainda presente         |
| `2026.5.28` | sim                | sim                        | árvore aninhada de dependências muito menor            |

A distinção importante: **o shrinkwrap em si não é o problema**.
A `v2026.5.28` ainda inclui o shrinkwrap raiz. O problema era o formato do pacote
que fazia o npm materializar uma grande árvore aninhada de dependências do
OpenClaw e todos os 12 pacotes de plataforma `@napi-rs/canvas`. A árvore
aninhada é menor na `v2026.5.28`, e a expansão para todas as plataformas do
Canvas já não aparece na auditoria local.

Para uma explicação em linguagem simples sobre shrinkwrap e as verificações de
pacote no nível de mantenedor, consulte [shrinkwrap do npm](/pt-BR/gateway/security/shrinkwrap).

## Interpretação da cadeia de suprimentos

A contagem de dependências é uma métrica de segurança operacional, não apenas
uma métrica de tamanho de instalação. Cada pacote amplia o conjunto de
mantenedores, tarballs, atualizações transitivas, binários nativos opcionais e
comportamentos durante a instalação em que os operadores precisam confiar.

A direção da limpeza é:

- manter recursos pesados e opcionais fora da instalação padrão do núcleo
- fazer com que os pacotes de plugins sejam responsáveis pelo próprio grafo de
  dependências de runtime
- evitar reparos pelo gerenciador de pacotes em runtime durante a inicialização
  do Gateway
- preservar instalações determinísticas sem causar a materialização de pacotes
  nativos para todas as plataformas
- manter scripts de instalação desativados nos fluxos de aceitação e medição de
  pacotes
- detectar árvores aninhadas de dependências e explosões de dependências nativas
  opcionais antes da publicação

Documentação relacionada:

- [Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution)
- [Inventário de plugins](/pt-BR/plugins/plugin-inventory)
- [Validação completa da versão](/pt-BR/reference/full-release-validation)
