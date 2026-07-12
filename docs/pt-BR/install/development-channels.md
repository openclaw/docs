---
read_when:
    - Você quer alternar entre stable/extended-stable/beta/dev
    - Você quer fixar uma versão, tag ou SHA específica
    - Você está criando tags ou publicando versões de pré-lançamento
sidebarTitle: Release Channels
summary: 'Canais estável, estável estendido, beta e de desenvolvimento: semântica, alternância, fixação de versão e marcação'
title: Canais de lançamento
x-i18n:
    generated_at: "2026-07-12T00:04:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

O OpenClaw oferece quatro canais de atualização:

- **estável**: dist-tag `latest` do npm. Recomendado para a maioria dos usuários.
- **estável estendido**: dist-tag `extended-stable` do npm. Um novo canal de pacotes
  para um mês anterior ainda com suporte. Ele é exclusivo para pacotes, e a
  instalação ocorre somente em primeiro plano. Uma seleção armazenada recebe
  avisos de atualização somente leitura quando `update.checkOnStart` está
  habilitado, mas nunca aplica atualizações automaticamente.
- **beta**: dist-tag `beta` do npm. Usa `latest` como alternativa quando `beta`
  está ausente ou é anterior à versão estável atual.
- **desenvolvimento**: ponta móvel de `main` (git). Dist-tag `dev` do npm quando
  publicado. `main` destina-se a experimentação e desenvolvimento ativo; pode
  conter recursos incompletos ou alterações incompatíveis. Não o execute em
  Gateways de produção.

As compilações estáveis geralmente são lançadas primeiro no canal **beta**,
validadas nele e depois promovidas a **latest** sem incremento de versão. Os
mantenedores também podem publicar diretamente em `latest`. As dist-tags são a
fonte da verdade para instalações pelo npm.

## Alternância entre canais

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` persiste a escolha em `update.channel` na configuração e controla
ambos os caminhos de instalação:

| Canal             | Instalações por npm/pacote                                                                                                                                                                                                       | Instalações pelo git                                                                                                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                                                                 | tag git estável mais recente (exclui `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` e outros sufixos nomeados de pré-lançamento)                                                           |
| `extended-stable` | resolve o seletor público `extended-stable` do npm, verifica o pacote exato selecionado e instala essa versão exata. Falha de forma fechada, sem usar `latest`, `beta` ou `dev` como alternativas.                                  | não compatível: o OpenClaw mantém o checkout inalterado e solicita que você use uma instalação por pacote                                                                                                                              |
| `beta`            | dist-tag `beta`, usando `latest` como alternativa quando `beta` está ausente ou é anterior                                                                                                                                         | tag git beta mais recente, usando a tag git estável mais recente como alternativa quando a beta está ausente ou é anterior                                                                                                             |
| `dev`             | dist-tag `dev` (rara; a maioria dos usuários de desenvolvimento usa instalações pelo git)                                                                                                                                         | busca as alterações, refaz o rebase do checkout sobre a branch `main` upstream, compila e reinstala a CLI global                                                                                                                        |

Para instalações `dev` pelo git, o checkout padrão é `~/openclaw` (ou
`$OPENCLAW_HOME/openclaw` quando `OPENCLAW_HOME` está definido); substitua-o
com `OPENCLAW_GIT_DIR`.

<Tip>
Para manter os canais estável e de desenvolvimento em paralelo, use dois checkouts separados e direcione cada Gateway para o seu próprio checkout.
</Tip>

## Direcionamento pontual para versão ou tag

Use `--tag` para direcionar uma dist-tag, versão ou especificação de pacote
específica em uma única atualização, **sem** alterar o canal persistido:

```bash
# Instalar uma versão específica
openclaw update --tag 2026.4.1-beta.1

# Instalar a partir da dist-tag beta (uso pontual, não persiste)
openclaw update --tag beta

# Alternar para o checkout móvel de main no GitHub (persistente)
openclaw update --channel dev

# Instalar uma especificação de pacote npm específica
openclaw update --tag openclaw@2026.4.1-beta.1

# Instalar uma vez a partir de main no GitHub sem persistir o canal
openclaw update --tag main
```

Observações:

- `--tag` aplica-se **somente a instalações por pacote (npm)**; instalações pelo
  git a ignoram.
- A tag não é persistida; o próximo `openclaw update` usa o canal configurado.
- `--tag main` é mapeado para a especificação compatível com npm
  `github:openclaw/openclaw#main` nessa única execução. Para uma instalação
  persistente da versão móvel de `main`, use `openclaw update --channel dev`
  (instalações por pacote alternam para um checkout git) ou reinstale usando o
  método git do instalador:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  O caminho de instalação pelo npm rejeita diretamente destinos de origem do
  GitHub/git e orienta você a usar o método git.
- Proteção contra downgrade: se a versão de destino for anterior à versão
  atual, o OpenClaw solicita confirmação (ignore com `--yes`).
- O canal estável estendido sempre usa seu destino de pacote exato verificado.
  Ele não é um alias pontual para `--tag extended-stable`, e `--tag` não pode
  ser combinado com um canal estável estendido efetivo.
- `--channel beta` difere de `--tag beta`: o fluxo do canal pode usar
  stable/latest como alternativa quando beta está ausente ou é anterior,
  enquanto `--tag beta` sempre direciona a dist-tag `beta` bruta nessa única
  execução.

## Simulação

Visualize o que `openclaw update` faria sem efetuar alterações:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

A simulação informa o canal efetivo, a versão de destino, as ações planejadas
e se seria necessária uma confirmação de downgrade.

## Plugins e canais

Alternar canais com `openclaw update` também sincroniza as origens dos plugins:

- `dev` alterna os plugins instalados que têm uma contraparte incluída de volta
  para sua origem incluída (checkout git).
- `stable` e `beta` restauram pacotes de plugins instalados pelo npm ou pelo
  ClawHub.
- `extended-stable` resolve plugins npm oficiais qualificados com intenção
  simples/padrão ou `latest` para a versão exata instalada do núcleo. Ele não
  consulta tags `@extended-stable` dos plugins em tempo de execução.
- Plugins instalados pelo npm são atualizados após a conclusão da atualização
  do núcleo.

## Verificação do status atual

```bash
openclaw update status
```

Mostra o canal ativo (com a origem que o determinou: configuração, tag git,
branch git, versão instalada ou padrão), o tipo de instalação (git ou pacote),
a versão atual e a disponibilidade de atualização.

## Práticas recomendadas para tags

- Marque as versões nas quais deseja que os checkouts git sejam posicionados:
  `vYYYY.M.PATCH` para estável e `vYYYY.M.PATCH-beta.N` para beta. Sufixos
  nomeados de pré-lançamento, como `-alpha.N`, `-rc.N` e `-next.N`, não são
  destinos estáveis nem beta.
- Tags estáveis numéricas legadas, como `vYYYY.M.PATCH-1` e `v1.0.1-1`, ainda
  são reconhecidas como tags git estáveis para fins de compatibilidade.
- `vYYYY.M.PATCH.beta.N` (separada por pontos) também é reconhecida para fins
  de compatibilidade; prefira `-beta.N`.
- Mantenha as tags imutáveis: nunca mova nem reutilize uma tag.
- As dist-tags do npm continuam sendo a fonte da verdade para instalações pelo
  npm:
  - `latest` -> estável
  - `extended-stable` -> versão de pacote de um mês anterior ainda com suporte
  - `beta` -> compilação candidata ou compilação estável lançada primeiro como beta
  - `dev` -> snapshot de main (opcional)

## Disponibilidade do aplicativo para macOS

As compilações beta e de desenvolvimento podem **não** incluir uma versão do
aplicativo para macOS. Isso não é um problema:

- A tag git e a dist-tag do npm ainda podem ser publicadas separadamente.
- Informe "sem compilação para macOS nesta versão beta" nas notas de lançamento
  ou no changelog.

## Relacionado

- [Atualização](/pt-BR/install/updating)
- [Detalhes internos do instalador](/pt-BR/install/installer)
