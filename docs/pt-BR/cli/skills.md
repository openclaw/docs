---
read_when:
    - Você quer ver quais Skills estão disponíveis e prontas para execução
    - Você quer pesquisar no ClawHub ou instalar Skills do ClawHub, do Git ou de diretórios locais
    - Você quer verificar uma skill do ClawHub com o ClawHub
    - Você quer depurar binários, variáveis de ambiente ou configurações ausentes para Skills
summary: Referência da CLI para `openclaw skills` (pesquisar/instalar/atualizar/verificar/listar/informações/checagem/workshop)
title: Skills
x-i18n:
    generated_at: "2026-07-12T15:03:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecione Skills locais, pesquise no ClawHub, instale Skills do ClawHub/Git/diretórios
locais, verifique Skills do ClawHub e atualize instalações rastreadas pelo ClawHub.

Relacionado:

- Sistema de Skills: [Skills](/pt-BR/tools/skills)
- Oficina de Skills: [Oficina de Skills](/pt-BR/tools/skill-workshop)
- Configuração de Skills: [Configuração de Skills](/pt-BR/tools/skills-config)
- Instalações do ClawHub: [ClawHub](/pt-BR/clawhub/cli)

## Comandos

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` e `verify` usam o ClawHub diretamente. `install @owner/<slug>`
instala uma Skill do ClawHub, `install git:owner/repo[@ref]` clona uma Skill do Git
e `install ./path` copia um diretório local de Skill. Por padrão, `install`,
`update` e `verify` usam como destino o diretório `skills/` do espaço de trabalho ativo;
com `--global`, usam como destino o diretório compartilhado de Skills gerenciadas.
`list`/`info`/`check` ainda inspecionam as Skills locais visíveis para o espaço de
trabalho e a configuração atuais. Comandos vinculados ao espaço de trabalho resolvem
o espaço de trabalho de destino por `--agent <id>`, depois pelo diretório de trabalho
atual quando ele está dentro do espaço de trabalho de um agente configurado e, por fim,
pelo agente padrão.

Instalações do Git e de diretórios locais esperam encontrar `SKILL.md` na raiz da origem.
O slug da instalação vem do `name` no frontmatter de `SKILL.md` quando ele é válido e,
em seguida, do nome do diretório de origem ou do repositório; use `--as <slug>` para
substituí-lo. `--version` é exclusivo do ClawHub. Instalações de Skills não oferecem
suporte a especificações de pacotes npm nem a caminhos de arquivos zip/compactados, e
`openclaw skills update` atualiza somente instalações rastreadas pelo ClawHub.

Instalações de dependências de Skills apoiadas pelo Gateway, acionadas pela integração
inicial ou pelas configurações de Skills, usam o caminho de solicitação separado
`skills.install`.

Observações:

| Opção/comportamento              | Descrição                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Consulta opcional; omita-a para navegar pelo feed de pesquisa padrão do ClawHub.                                                                                                                                                                                                                                    |
| `search --limit <n>`             | Limita a quantidade de resultados retornados.                                                                                                                                                                                                                                                                       |
| `install git:owner/repo[@ref]`   | Instala uma Skill do Git. Referências de branches podem conter barras, como `git:owner/repo@feature/foo`.                                                                                                                                                                                                            |
| `install ./path/to/skill`        | Instala um diretório local cuja raiz contém `SKILL.md`.                                                                                                                                                                                                                                                             |
| `install --as <slug>`            | Substitui o slug inferido para instalações do Git e de diretórios locais.                                                                                                                                                                                                                                           |
| `install --version <version>`    | Aplica-se somente a referências de Skills do ClawHub.                                                                                                                                                                                                                                                              |
| `install --force`                | Sobrescreve uma pasta de Skill existente no espaço de trabalho para o mesmo slug.                                                                                                                                                                                                                                   |
| `install/update --force-install` | Instala uma Skill pendente do ClawHub apoiada pelo GitHub antes que a verificação do ClawHub seja concluída.                                                                                                                                                                                                        |
| `--global`                       | Usa como destino o diretório compartilhado de Skills gerenciadas; não pode ser combinado com `--agent <id>`.                                                                                                                                                                                                        |
| `--agent <id>`                   | Usa como destino o espaço de trabalho de um agente configurado; substitui a inferência baseada no diretório de trabalho atual.                                                                                                                                                                                       |
| `update @owner/<slug>`           | Atualiza uma única Skill rastreada. Adicione `--global` para usar como destino o diretório compartilhado de Skills gerenciadas em vez do espaço de trabalho.                                                                                                                                                         |
| `update --all`                   | Atualiza instalações rastreadas do ClawHub no espaço de trabalho selecionado ou, com `--global`, no diretório compartilhado de Skills gerenciadas.                                                                                                                                                                   |
| `verify @owner/<slug>`           | Exibe por padrão o envelope JSON `clawhub.skill.verify.v1` do ClawHub. Não há opção `--json`, pois JSON já é o padrão. Slugs sem proprietário são aceitos por compatibilidade quando a Skill já está instalada ou não é ambígua; referências qualificadas pelo proprietário evitam ambiguidade quanto ao publicador. |
| Proveniência de `verify`         | Quando o ClawHub retorna a proveniência da origem resolvida pelo servidor, o JSON de verificação também inclui um `openclaw.verifiedSourceUrl` fixado em um commit. URLs de origem indisponíveis ou autodeclaradas permanecem apenas no envelope de proveniência bruto e não são promovidas.                           |
| Seletor de versão de `verify`    | `verify` usa `.clawhub/origin.json` para Skills instaladas do ClawHub, portanto verifica a versão instalada no registro de origem. `--version` e `--tag` substituem o seletor de versão, mas mantêm o registro instalado quando existem metadados de origem.                                                          |
| `verify --card`                  | Exibe o Markdown do Cartão de Skill gerado em vez de JSON. Encerra com código diferente de zero quando o ClawHub retorna `ok: false` ou `decision: "fail"`; assinaturas não assinadas têm caráter informativo, a menos que a política do ClawHub seja alterada.                                                         |
| Impressão digital do Cartão de Skill | Pacotes instalados do ClawHub podem incluir um `skill-card.md` gerado. O OpenClaw trata a verificação como uma decisão do servidor do ClawHub e não rejeita uma Skill instalada apenas porque esse cartão gerado altera a impressão digital do pacote.                                                              |
| `check --agent <id>`             | Verifica o espaço de trabalho do agente selecionado e informa quais Skills prontas estão realmente visíveis no prompt ou na superfície de comandos desse agente.                                                                                                                                                     |
| `list`                           | Ação padrão quando nenhum subcomando é fornecido.                                                                                                                                                                                                                                                                   |
| Saída de `list`/`info`/`check`   | A saída renderizada é enviada para stdout. Com `--json`, a carga legível por máquina permanece em stdout para pipes e scripts.                                                                                                                                                                                       |

Instalações e atualizações de Skills da comunidade no ClawHub verificam a confiança antes
do download. Versões de arquivos da comunidade com versionamento usam metadados de
confiança da versão exata. Skills do GitHub apoiadas por um resolvedor dependem do
resolvedor de instalação do ClawHub para aplicar a política de verificação e instalação
forçada antes de retornar um commit fixado; use `--force-install` para instalar uma Skill
pendente apoiada pelo GitHub antes que essa verificação seja concluída. Versões maliciosas
ou bloqueadas da comunidade são recusadas. Versões arriscadas da comunidade exigem análise
e `--acknowledge-clawhub-risk` quando um comando não interativo deve continuar após essa
análise. Publicadores oficiais de Skills do ClawHub e origens de Skills incluídas no
OpenClaw ignoram essa solicitação de confirmação da confiança da versão.

## Oficina de Skills

`openclaw skills workshop` gerencia propostas pendentes de Skills no espaço de trabalho
selecionado. As propostas não são Skills ativas até serem aplicadas. Para saber mais sobre
o armazenamento de propostas, as proteções de arquivos auxiliares, os métodos do Gateway
e a política de aprovação, consulte [Oficina de Skills](/pt-BR/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Checklist de QA repetível" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Checklist de QA repetível" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicada"
openclaw skills workshop quarantine <proposal-id> --reason "Requer revisão de segurança"
```

`propose-create`, `propose-update` e `revise` também aceitam `--goal <text>`
e `--evidence <text>` para registrar a motivação da proposta e as observações
de apoio junto com o conteúdo de `--proposal`/`--proposal-dir`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Skills](/pt-BR/tools/skills)
