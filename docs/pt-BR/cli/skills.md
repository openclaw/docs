---
read_when:
    - Você quer ver quais skills estão disponíveis e prontas para executar
    - Você quer pesquisar no ClawHub ou instalar Skills do ClawHub, Git ou diretórios locais
    - Você quer verificar uma habilidade do ClawHub com o ClawHub
    - Você quer depurar binários/env/config ausentes para Skills
summary: Referência da CLI para `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:21:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecione Skills locais, pesquise no ClawHub, instale Skills a partir do ClawHub/Git/diretórios locais, verifique Skills do ClawHub e atualize instalações rastreadas pelo ClawHub.

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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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

`search`, `update` e `verify` usam o ClawHub diretamente. `install @owner/<slug>` instala uma Skill do ClawHub, `install git:owner/repo[@ref]` clona uma Skill Git, e `install ./path` copia um diretório de Skill local. Por padrão, `install`, `update` e `verify` apontam para o diretório `skills/` do workspace ativo; com `--global`, apontam para o diretório compartilhado de Skills gerenciadas. `list`/`info`/`check` ainda inspecionam as Skills locais visíveis para o workspace e a configuração atuais. Comandos baseados em workspace resolvem o workspace de destino a partir de `--agent <id>`, depois do diretório de trabalho atual quando ele está dentro de um workspace de agente configurado e, em seguida, do agente padrão.

Instalações de Git e diretório local esperam `SKILL.md` na raiz da origem. O slug de instalação vem do `name` no frontmatter de `SKILL.md` quando ele é válido, depois do nome do diretório de origem ou do repositório; use `--as <slug>` para substituí-lo. `--version` é somente para ClawHub. Instalações de Skills não aceitam especificações de pacotes npm nem caminhos zip/arquivo, e `openclaw skills update` atualiza somente instalações rastreadas pelo ClawHub.

Instalações de dependências de Skills baseadas no Gateway, acionadas pelo onboarding ou pelas configurações de Skills, usam o caminho de solicitação separado `skills.install`.

Observações:

- `search [query...]` aceita uma consulta opcional; omita-a para navegar pelo feed de pesquisa padrão do ClawHub.
- `search --limit <n>` limita os resultados retornados.
- `install git:owner/repo[@ref]` instala uma Skill Git. Referências de branch podem conter barras, como `git:owner/repo@feature/foo`.
- `install ./path/to/skill` instala um diretório local cuja raiz contém `SKILL.md`.
- `install --as <slug>` substitui o slug inferido para instalações de Git e de diretório local.
- `install --version <version>` aplica-se somente a referências de Skills do ClawHub.
- `install --force` sobrescreve uma pasta de Skill existente no workspace para o mesmo slug.
- Instalações e atualizações de Skills comunitárias do ClawHub verificam a confiança antes do download. Lançamentos de arquivo comunitários com versão usam metadados de confiança de lançamento exato. Skills do GitHub baseadas em resolver dependem do resolvedor de instalação do ClawHub para aplicar a política de varredura e instalação forçada antes que ele retorne um commit fixado. Lançamentos comunitários maliciosos ou bloqueados são recusados. Lançamentos comunitários arriscados exigem revisão e `--acknowledge-clawhub-risk` quando um comando não interativo deve continuar após essa revisão. Publicadores oficiais de Skills do ClawHub e origens de Skills agrupadas do OpenClaw ignoram esse prompt de confiança de lançamento.
- `--global` aponta para o diretório compartilhado de Skills gerenciadas e não pode ser combinado com `--agent <id>`.
- `--agent <id>` aponta para um workspace de agente configurado e substitui a inferência do diretório de trabalho atual.
- `update @owner/<slug>` atualiza uma única Skill rastreada. Adicione `--global` para apontar para o diretório compartilhado de Skills gerenciadas em vez do workspace.
- `update --all` atualiza instalações rastreadas do ClawHub no workspace selecionado, ou no diretório compartilhado de Skills gerenciadas quando combinado com `--global`.
- `verify @owner/<slug>` imprime por padrão o envelope JSON `clawhub.skill.verify.v1` do ClawHub. Não há flag `--json` porque JSON já é o padrão. Slugs simples continuam aceitos por compatibilidade quando a Skill já está instalada ou é inequívoca, mas referências qualificadas por proprietário evitam ambiguidade de publicador.
- Quando o ClawHub retorna proveniência de origem resolvida pelo servidor, o JSON de verificação também inclui um `openclaw.verifiedSourceUrl` fixado por commit. URLs de origem indisponíveis ou autodeclaradas permanecem apenas no envelope de proveniência bruto e não são promovidas.
- `verify` usa `.clawhub/origin.json` para Skills do ClawHub instaladas, portanto verifica a versão instalada em relação ao registro de onde ela veio. `--version` e `--tag` substituem o seletor de versão, mas mantêm esse registro instalado quando existem metadados de origem.
- `verify --card` imprime o Markdown do Cartão da Skill gerado em vez de JSON. O comando sai com código diferente de zero quando o ClawHub retorna `ok: false` ou `decision: "fail"`; assinaturas não assinadas são informativas, a menos que a política do ClawHub mude.
- Pacotes do ClawHub instalados podem incluir um `skill-card.md` gerado. O OpenClaw trata a verificação como uma decisão do servidor ClawHub e não rejeita uma Skill instalada apenas porque esse cartão gerado altera a impressão digital do pacote.
- `check --agent <id>` verifica o workspace do agente selecionado e informa quais Skills prontas estão realmente visíveis para o prompt ou a superfície de comando desse agente.
- `list` é a ação padrão quando nenhum subcomando é fornecido.
- `list`, `info` e `check` gravam a saída renderizada em stdout. Com `--json`, isso significa que o payload legível por máquina permanece em stdout para pipes e scripts.

## Oficina de Skills

`openclaw skills workshop` gerencia propostas de Skills pendentes no workspace selecionado. Propostas não são Skills ativas até serem aplicadas. Para armazenamento de propostas, proteções de arquivos de suporte, métodos do Gateway e política de aprovação, consulte [Oficina de Skills](/pt-BR/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Skills](/pt-BR/tools/skills)
