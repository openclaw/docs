---
read_when:
    - Publicando uma Skill ou um Plugin
    - Depuração de erros de escopo de proprietário ou pacote
    - Adicionando interface de publicação, CLI ou comportamento de servidor
summary: Como funciona a publicação no ClawHub para Skills, plugins, proprietários, escopos, lançamentos e revisão.
x-i18n:
    generated_at: "2026-05-10T19:25:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61de013f0ac82acbf20f99c3e0c92c8e31d3de14e9ee64f7bc7659d522747089
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publicação

A publicação no ClawHub é escopada por proprietário: cada publicação tem como alvo um publicador, e o servidor decide se o usuário conectado tem permissão para publicar ali.

## Proprietários

Um proprietário é um identificador de publicador do ClawHub, como `@alice` ou `@openclaw`.
Proprietários pessoais são criados para usuários. Proprietários de organização podem ter vários membros.

Ao publicar, você usa seu proprietário pessoal ou escolhe um proprietário de organização onde tenha acesso de publicador.

## Skills

Skills são publicadas a partir de uma pasta de skill. A página pública é:

```text
https://clawhub.ai/<owner>/<slug>
```

Exemplo:

```text
https://clawhub.ai/alice/review-helper
```

A solicitação de publicação inclui o proprietário selecionado, slug, versão, changelog e arquivos. O servidor verifica se o ator pode publicar como esse proprietário antes de criar a versão.

Para mover uma skill existente para outro proprietário ao publicar uma nova versão, escolha o novo proprietário e confirme explicitamente a mudança de propriedade. Na CLI/API, passe o proprietário de destino mais a opção de migração:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

A migração de proprietário de skill exige acesso de administrador ou proprietário tanto no proprietário atual quanto no proprietário de destino. Ela preserva a skill, o histórico de versões, estatísticas, comentários, forks, aliases e trilha de auditoria; URLs do proprietário antigo continuam funcionando pelo caminho de alias/redirecionamento.

## Plugins

Plugins usam nomes de pacote no estilo npm. Nomes de pacote com escopo incluem o proprietário na primeira parte do nome:

```text
@owner/package-name
```

O escopo deve corresponder ao proprietário de publicação selecionado. Se seu pacote se chama `@openclaw/dronzer`, ele só pode ser publicado como `@openclaw`. Se você publicar como `@vintageayu`, renomeie o pacote para `@vintageayu/dronzer`.

Isso impede que um pacote reivindique um namespace de organização que o publicador não controla.

## Fluxo de lançamento

1. A UI, CLI ou o fluxo de trabalho do GitHub coleta metadados e arquivos do pacote.
2. A solicitação de publicação é enviada ao ClawHub com o proprietário selecionado.
3. O servidor valida permissões do proprietário, escopo do pacote, nome do pacote, versão, limites de arquivos e metadados de origem.
4. O ClawHub armazena o lançamento e inicia verificações automatizadas de segurança.
5. Novos lançamentos ficam ocultos das superfícies normais de instalação/download até que a revisão e a verificação terminem.

Se a validação falhar, o lançamento não será criado.

## FAQ

### O escopo do pacote deve corresponder ao proprietário selecionado

Se o escopo do pacote e o proprietário selecionado não corresponderem, o ClawHub rejeita a publicação:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Para corrigir, escolha o proprietário indicado pelo escopo do pacote ou renomeie o pacote para que o escopo corresponda ao proprietário como o qual você pode publicar.

Se o nome do pacote já tiver o escopo correto, mas o pacote pertencer ao publicador errado, transfira a propriedade:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Use a transferência de pacote somente quando tiver acesso de administrador tanto ao proprietário atual do pacote quanto ao publicador de destino. Ela não permite publicar em um escopo que você não pode gerenciar.

Isso protege namespaces de organização. Um pacote chamado `@openclaw/dronzer` reivindica o namespace `@openclaw`, portanto somente publicadores com acesso ao proprietário `@openclaw` podem publicá-lo.
