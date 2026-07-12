---
read_when:
    - Você quer alternar entre stable/extended-stable/beta/dev
    - Você quer fixar uma versão, tag ou SHA específica
    - Você está marcando ou publicando pré-lançamentos
sidebarTitle: Release Channels
summary: 'Canais estável, estável estendido, beta e de desenvolvimento: semântica, alternância, fixação de versão e marcação'
title: Canais de lançamento
x-i18n:
    generated_at: "2026-07-12T15:20:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

O OpenClaw oferece quatro canais de atualização:

- **stable**: dist-tag do npm `latest`. Recomendado para a maioria dos usuários.
- **extended-stable**: dist-tag do npm `extended-stable`. Um novo canal de
  pacotes de mês anterior ainda com suporte. Ele é exclusivo para pacotes, e a
  instalação ocorre somente em primeiro plano. Uma seleção armazenada recebe
  avisos de atualização somente leitura quando `update.checkOnStart` está
  habilitado, mas nunca aplica atualizações automaticamente.
- **beta**: dist-tag do npm `beta`. Usa `latest` como alternativa quando `beta`
  não existe ou é anterior à versão estável atual.
- **dev**: ponta móvel de `main` (git). dist-tag do npm `dev`, quando publicado.
  `main` destina-se a experimentação e desenvolvimento ativo; pode conter
  recursos incompletos ou alterações incompatíveis. Não o execute em gateways
  de produção.

As compilações estáveis geralmente são lançadas primeiro no canal **beta**,
onde são validadas, e depois promovidas para **latest** sem incremento de
versão. Os mantenedores também podem publicar diretamente em `latest`. Os
dist-tags são a fonte oficial para instalações via npm.

## Alternância entre canais

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` persiste a escolha em `update.channel` na configuração e controla
ambos os caminhos de instalação:

| Canal             | Instalações via npm/pacote                                                                                                                                                                            | Instalações via git                                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                                      | tag git estável mais recente (exclui `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` e outros sufixos nomeados de pré-lançamento)                          |
| `extended-stable` | resolve o seletor público `extended-stable` do npm, verifica o pacote exato selecionado e instala essa versão exata. Encerra com falha, sem alternativa para `latest`, `beta` ou `dev`.                 | não compatível: o OpenClaw mantém o checkout inalterado e solicita que você use uma instalação via pacote                                                                                              |
| `beta`            | dist-tag `beta`, usando `latest` como alternativa quando `beta` não existe ou é anterior                                                                                                               | tag git beta mais recente, usando o tag git estável mais recente como alternativa quando o beta não existe ou é anterior                                                                                |
| `dev`             | dist-tag `dev` (raro; a maioria dos usuários do canal dev utiliza instalações via git)                                                                                                                 | busca as alterações, reorganiza o checkout sobre o branch upstream `main`, compila e reinstala a CLI global                                                                                            |

Para instalações de `dev` via git, o checkout padrão é `~/openclaw` (ou
`$OPENCLAW_HOME/openclaw` quando `OPENCLAW_HOME` está definido); substitua-o
com `OPENCLAW_GIT_DIR`.

<Tip>
Para manter os canais stable e dev em paralelo, use dois checkouts separados e direcione cada gateway ao seu próprio checkout.
</Tip>

## Seleção pontual de versão ou tag

Use `--tag` para selecionar um dist-tag, uma versão ou uma especificação de
pacote para uma única atualização **sem** alterar o canal persistido:

```bash
# Instalar uma versão específica
openclaw update --tag 2026.4.1-beta.1

# Instalar usando o dist-tag beta (pontual, não persiste)
openclaw update --tag beta

# Alternar para o checkout móvel main do GitHub (persistente)
openclaw update --channel dev

# Instalar uma especificação de pacote npm específica
openclaw update --tag openclaw@2026.4.1-beta.1

# Instalar uma vez usando main do GitHub sem persistir o canal
openclaw update --tag main
```

Observações:

- `--tag` aplica-se **somente a instalações via pacote (npm)**; instalações via
  git o ignoram.
- O tag não é persistido; a próxima execução de `openclaw update` usa o canal
  configurado.
- `--tag main` é mapeado para a especificação compatível com npm
  `github:openclaw/openclaw#main` nessa única execução. Para uma instalação
  móvel persistente de `main`, use `openclaw update --channel dev` (instalações
  via pacote mudam para um checkout git) ou reinstale usando o método git do
  instalador:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  O caminho de instalação via npm rejeita diretamente destinos de origem
  GitHub/git e orienta você a usar o método git.
- Proteção contra downgrade: se a versão de destino for anterior à versão
  atual, o OpenClaw solicita confirmação (ignore com `--yes`).
- O extended-stable sempre usa seu destino exato de pacote verificado. Ele não
  é um alias pontual para `--tag extended-stable`, e `--tag` não pode ser
  combinado com um canal extended-stable efetivo.
- `--channel beta` difere de `--tag beta`: o fluxo do canal pode usar
  stable/latest como alternativa quando o beta não existe ou é anterior,
  enquanto `--tag beta` sempre seleciona diretamente o dist-tag `beta` nessa
  única execução.

## Simulação

Visualize o que `openclaw update` faria sem realizar alterações:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

A simulação informa o canal efetivo, a versão de destino, as ações planejadas
e se seria necessária uma confirmação de downgrade.

## Plugins e canais

A alternância de canais com `openclaw update` também sincroniza as origens dos
plugins:

- `dev` faz com que os plugins instalados que possuem um equivalente incluído
  retornem à origem incluída (checkout git).
- `stable` e `beta` restauram pacotes de plugins instalados via npm ou ClawHub.
- `extended-stable` resolve plugins npm oficiais elegíveis com intenção
  simples/padrão ou `latest` para a versão exata instalada do núcleo. Ele não
  consulta tags `@extended-stable` de plugins durante a execução.
- Os plugins instalados via npm são atualizados após a conclusão da atualização
  do núcleo.

## Verificação do status atual

```bash
openclaw update status
```

Exibe o canal ativo (com a origem que o determinou: configuração, tag git,
branch git, versão instalada ou padrão), o tipo de instalação (git ou pacote),
a versão atual e a disponibilidade de atualização.

## Práticas recomendadas para tags

- Aplique tags às versões nas quais os checkouts git devem se basear:
  `vYYYY.M.PATCH` para stable, `vYYYY.M.PATCH-beta.N` para beta. Sufixos
  nomeados de pré-lançamento, como `-alpha.N`, `-rc.N` e `-next.N`, não são
  destinos stable nem beta.
- Tags estáveis numéricos legados, como `vYYYY.M.PATCH-1` e `v1.0.1-1`, ainda
  são reconhecidos como tags git estáveis para fins de compatibilidade.
- `vYYYY.M.PATCH.beta.N` (separado por pontos) também é reconhecido para fins de
  compatibilidade; prefira `-beta.N`.
- Mantenha os tags imutáveis: nunca mova nem reutilize um tag.
- Os dist-tags do npm continuam sendo a fonte oficial para instalações via npm:
  - `latest` -> stable
  - `extended-stable` -> versão de pacote do mês anterior ainda com suporte
  - `beta` -> compilação candidata ou compilação estável lançada primeiro como beta
  - `dev` -> snapshot de main (opcional)

## Disponibilidade do aplicativo para macOS

As compilações beta e dev podem **não** incluir uma versão do aplicativo para
macOS. Isso não é um problema:

- O tag git e o dist-tag do npm ainda podem ser publicados de forma
  independente.
- Informe "sem compilação para macOS neste beta" nas notas de versão ou no
  changelog.

## Relacionado

- [Atualização](/pt-BR/install/updating)
- [Componentes internos do instalador](/pt-BR/install/installer)
