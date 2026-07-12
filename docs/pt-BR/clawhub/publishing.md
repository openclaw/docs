---
read_when:
    - Publicação de uma skill ou Plugin
    - Depuração de erros de proprietário ou de escopo de pacote
    - Adição de comportamento de publicação na interface, na CLI ou no backend
summary: Como funciona a publicação no ClawHub para Skills, plugins, proprietários, escopos, versões e revisão.
x-i18n:
    generated_at: "2026-07-11T23:46:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publicação

A publicação envia uma pasta de skill ou um pacote de plugin ao ClawHub sob o proprietário que você escolher. O ClawHub verifica se seu token pode publicar para esse proprietário, valida os metadados, o nome, a versão, os arquivos e as informações de origem, armazena a versão e inicia verificações de segurança automatizadas.

Se a validação falhar, nada será publicado. Novas versões também podem permanecer fora das áreas normais de instalação e download até a conclusão da análise.

## Skills

A forma mais simples de publicar é pela CLI. Autentique-se e publique uma pasta de skill local:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Use `--owner <handle>` ao publicar para o proprietário de uma organização. Omita essa opção para publicar como o usuário autenticado. A publicação ignora conteúdo que não foi alterado. Uma nova skill começa na versão `1.0.0`, e alterações posteriores publicam automaticamente a próxima versão de correção. Passe `--version` somente quando precisar de uma versão explícita.

Para repositórios de catálogo, use o
[fluxo de trabalho reutilizável `skill-publish.yml` do ClawHub](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Ele chama `skill publish` para cada pasta de skill diretamente abaixo de `root` (padrão:
`skills`) ou somente para a pasta fornecida como `skill_path`.

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

Use `dry_run: true` para visualizar skills novas e alteradas sem publicá-las.

## Plugins

Plugins usam nomes de pacote no estilo do npm. Nomes de pacote com escopo incluem o proprietário na primeira parte do nome:

```text
@owner/package-name
```

O escopo deve corresponder ao proprietário selecionado para a publicação. Se o pacote se chamar `@openclaw/dronzer`, ele só poderá ser publicado como `@openclaw`. Se você publicar como `@vintageayu`, renomeie o pacote para `@vintageayu/dronzer`.

Isso impede que um pacote reivindique o namespace de uma organização que o publicador não controla.

Se você for o proprietário legítimo de uma organização, marca, escopo de pacote, identificador de proprietário ou namespace que já esteja reivindicado ou reservado no ClawHub, abra uma
[issue de reivindicação de organização/namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
com comprovação pública e não confidencial. Consulte
[Reivindicações de organizações e namespaces](/clawhub/namespace-claims) para saber o que incluir e o que não divulgar em issues públicas.

### Antes de publicar um Plugin

- Escolha um proprietário que corresponda ao escopo do pacote.
- Inclua `openclaw.plugin.json`. Plugins com código também precisam de `package.json` com
  `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.
- Para exibir um ícone personalizado no cartão do plugin, adicione `icon` a `openclaw.plugin.json` com qualquer URL de imagem HTTPS.
- Inclua o repositório de origem e os metadados exatos do commit ou use a CLI em um checkout vinculado ao GitHub para que ela possa detectá-los.
- Execute `clawhub package validate <source>` antes de publicar. Para problemas relacionados ao pacote, manifesto, importação do SDK ou artefato, consulte
  [Correções de validação de plugins](/clawhub/plugin-validation-fixes).
- Execute `clawhub package publish <source> --dry-run` antes de criar uma versão.
- Espere que novas versões permaneçam fora das áreas públicas de instalação até a conclusão das verificações de segurança automatizadas e da verificação.

### Publicação confiável de pacotes

A configuração da publicação confiável de pacotes tem duas etapas:

1. Publique o pacote uma vez por meio da publicação manual normal ou autenticada por token com
   `clawhub package publish`. Isso cria o registro do pacote e define os gerentes do pacote que podem alterar sua configuração de publicador confiável.
2. Um gerente do pacote define a configuração de publicador confiável do GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Depois que a configuração for definida, as futuras publicações compatíveis do GitHub Actions poderão usar OIDC/publicação confiável sem armazenar um token de longa duração do ClawHub no repositório. O repositório e o nome do arquivo de fluxo de trabalho configurados devem corresponder à declaração OIDC do GitHub Actions. Se você também passar `--environment <name>`, a declaração de ambiente do GitHub Actions deverá corresponder exatamente a esse nome.

O ClawHub verifica o repositório GitHub configurado quando a configuração de publicador confiável é definida. Repositórios públicos podem ser verificados por meio dos metadados públicos do GitHub. Repositórios privados exigem que o ClawHub tenha acesso do GitHub a esse repositório, por exemplo, por meio de uma futura instalação do GitHub App do ClawHub ou de outra integração autorizada com o GitHub.

O fluxo de trabalho reutilizável atual para publicação de pacotes permite publicação confiável sem segredos em publicações por `workflow_dispatch` quando `id-token: write` está disponível. Publicações reais por envio de tag ainda precisam de `clawhub_token`; portanto, mantenha `CLAWHUB_TOKEN` disponível para lançamentos por tag, primeiras publicações, pacotes não confiáveis ou publicações emergenciais.

Inspecione ou remova a configuração com:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Excluir a configuração de publicador confiável é o procedimento de reversão. Isso desativa a emissão futura de tokens de publicação confiável até que um gerente do pacote defina a configuração novamente.

## Perguntas frequentes

### O escopo do pacote deve corresponder ao proprietário selecionado

Se o escopo do pacote e o proprietário selecionado não corresponderem, o ClawHub rejeitará a publicação:

```text
O escopo do pacote "@openclaw" deve corresponder ao proprietário selecionado "@vintageayu".
Publique como "@openclaw" ou renomeie este pacote para "@vintageayu/dronzer".
```

Para corrigir, escolha o proprietário indicado pelo escopo do pacote ou renomeie o pacote para que o escopo corresponda ao proprietário em cujo nome você pode publicar.

Se o nome do pacote já tiver o escopo correto, mas o pacote pertencer ao publicador errado, transfira a propriedade:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Use a transferência de pacote ou skill somente quando tiver acesso administrativo tanto ao proprietário atual quanto ao publicador de destino. A transferência de pacote não permite publicar em um escopo que você não pode gerenciar.

Se você não tiver acesso ao proprietário atual, mas acreditar que sua organização, projeto ou marca é o proprietário legítimo do namespace, abra uma
[issue de reivindicação de organização/namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
com comprovação pública e não confidencial para análise da equipe. Consulte
[Reivindicações de organizações e namespaces](/clawhub/namespace-claims) antes de enviar.

Isso protege os namespaces das organizações. Um pacote chamado `@openclaw/dronzer` reivindica o namespace `@openclaw`; portanto, somente publicadores com acesso ao proprietário `@openclaw` podem publicá-lo.
