---
read_when:
    - Publicando um skill ou plugin
    - Depuração de erros de proprietário ou escopo de pacote
    - Adicionando comportamento de publicação na interface, CLI ou backend
summary: Como a publicação no ClawHub funciona para Skills, Plugins, proprietários, escopos, lançamentos e revisão.
x-i18n:
    generated_at: "2026-06-27T17:16:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publicação

A publicação envia uma pasta de skill ou pacote de Plugin para o ClawHub sob o proprietário que você
escolher. O ClawHub verifica se seu token pode publicar para esse proprietário, valida as
informações de metadados, nome, versão, arquivos e origem, depois armazena a versão
e inicia verificações de segurança automatizadas.

Se a validação falhar, nada será publicado. Novas versões também podem ficar fora das
superfícies normais de instalação e download até que a revisão termine.

## Skills

O caminho de publicação mais simples é a CLI. Entre e depois publique uma pasta de skill
local:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Use `--owner <handle>` ao publicar para um proprietário de organização. Omita para publicar como
o usuário autenticado. A publicação ignora conteúdo inalterado. Uma nova skill começa
em `1.0.0`, e alterações posteriores publicam automaticamente a próxima versão de patch. Passe
`--version` somente quando precisar de uma versão explícita.

Para repositórios de catálogo, use o workflow reutilizável
[`skill-publish.yml` do ClawHub](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Ele chama `skill publish` para cada pasta de skill imediata em `root` (padrão:
`skills`), ou somente a pasta fornecida como `skill_path`.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Use `dry_run: true` para pré-visualizar Skills novas e alteradas sem publicar.

## Plugins

Plugins usam nomes de pacote no estilo npm. Nomes de pacote com escopo incluem o proprietário na
primeira parte do nome:

```text
@owner/package-name
```

O escopo deve corresponder ao proprietário de publicação selecionado. Se seu pacote se chama
`@openclaw/dronzer`, ele só pode ser publicado como `@openclaw`. Se você publicar como
`@vintageayu`, renomeie o pacote para `@vintageayu/dronzer`.

Isso impede que um pacote reivindique um namespace de organização que o publicador não
controla.

Se você for o proprietário legítimo de uma organização, marca, escopo de pacote, identificador de proprietário ou
namespace que já está reivindicado ou reservado no ClawHub, abra uma
[issue de Reivindicação de Organização / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
com prova pública e não sensível. Veja
[Reivindicações de Organização e Namespace](/pt-BR/clawhub/namespace-claims) para saber o que incluir e o que
manter fora de issues públicas.

### Antes de Publicar um Plugin

- Escolha um proprietário que corresponda ao escopo do pacote.
- Inclua `openclaw.plugin.json`. Plugins de código também precisam de `package.json` com
  `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.
- Para exibir um ícone personalizado no cartão do Plugin, adicione `icon` ao `openclaw.plugin.json` com
  qualquer URL de imagem HTTPS.
- Inclua o repositório de origem e os metadados exatos de commit, ou use a CLI a partir de um
  checkout baseado no GitHub para que ela possa detectá-los.
- Execute `clawhub package validate <source>` antes de publicar. Para achados de pacote,
  manifesto, importação de SDK ou artefato, veja
  [Correções de validação de Plugin](/pt-BR/clawhub/plugin-validation-fixes).
- Execute `clawhub package publish <source> --dry-run` antes de criar uma versão.
- Espere que novas versões fiquem fora das superfícies públicas de instalação até que as
  verificações de segurança automatizadas e a verificação terminem.

### Publicação Confiável para Pacotes

A publicação confiável de pacotes é uma configuração em duas etapas:

1. Publique o pacote uma vez por meio de `clawhub package publish` normal manual ou autenticado por token. Isso cria o registro do pacote e estabelece os
   gerentes do pacote que podem alterar sua configuração de publicador confiável.
2. Um gerente do pacote define a configuração de publicador confiável do GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Depois que a configuração é definida, publicações futuras compatíveis pelo GitHub Actions podem usar
OIDC/publicação confiável sem armazenar um token ClawHub de longa duração no
repositório. O repositório configurado e o nome do arquivo de workflow devem corresponder à
declaração OIDC do GitHub Actions. Se você também passar `--environment <name>`, a declaração de ambiente do GitHub
Actions deve corresponder exatamente a esse nome.

O ClawHub verifica o repositório GitHub configurado quando a configuração de publicador confiável
é definida. Repositórios públicos podem ser verificados por meio de metadados públicos do GitHub.
Repositórios privados exigem que o ClawHub tenha acesso do GitHub a esse repositório,
por exemplo, por meio de uma futura instalação do GitHub App do ClawHub ou outra
integração GitHub autorizada.

O workflow reutilizável atual de publicação de pacotes oferece suporte a publicação confiável
sem segredo para publicações `workflow_dispatch` quando `id-token: write` está
disponível. Publicações reais por push de tag ainda precisam de `clawhub_token`, então mantenha
`CLAWHUB_TOKEN` disponível para versões por tag, primeiras publicações, pacotes não confiáveis
ou publicações emergenciais.

Inspecione ou remova a configuração com:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Excluir a configuração de publicador confiável é o caminho de reversão. Isso desativa a emissão futura de
tokens de publicação confiável até que um gerente do pacote defina a configuração novamente.

## Perguntas Frequentes

### O escopo do pacote deve corresponder ao proprietário selecionado

Se o escopo do pacote e o proprietário selecionado não corresponderem, o ClawHub rejeita a
publicação:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Para corrigir isso, escolha o proprietário nomeado pelo escopo do pacote ou renomeie o
pacote para que o escopo corresponda ao proprietário pelo qual você pode publicar.

Se o nome do pacote já tiver o escopo correto, mas o pacote pertencer ao
publicador errado, transfira a propriedade em vez disso:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Use transferência de pacote ou skill somente quando tiver acesso de administrador tanto ao
proprietário atual quanto ao publicador de destino. A transferência de pacote não permite
publicar em um escopo que você não pode gerenciar.

Se você não tiver acesso ao proprietário atual, mas acreditar que sua organização, projeto ou
marca é o proprietário legítimo do namespace, abra uma
[issue de Reivindicação de Organização / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
com prova pública e não sensível para revisão da equipe. Veja
[Reivindicações de Organização e Namespace](/pt-BR/clawhub/namespace-claims) antes de registrar.

Isso protege namespaces de organizações. Um pacote chamado `@openclaw/dronzer` reivindica o
namespace `@openclaw`, então somente publicadores com acesso ao proprietário `@openclaw`
podem publicá-lo.
