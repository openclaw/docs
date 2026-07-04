---
read_when:
    - Revisando uploads em busca de abuso ou violações de política
    - Escrever documentação de moderação ou runbooks para revisores
    - Decidindo se uma skill deve ser ocultada ou se um usuário deve ser banido
sidebarTitle: Acceptable Usage
summary: 'Política do marketplace: o que o ClawHub permite e o que ele não hospedará.'
title: Uso aceitável
x-i18n:
    generated_at: "2026-07-04T17:51:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceitável

ClawHub hospeda Skills, plugins, pacotes e metadados de marketplace para OpenClaw.
Use esta página para decidir se um conteúdo ou comportamento de publicação pertence ao
ClawHub.

Estas regras se aplicam ao que uma listagem faz, ao que ela pede que os usuários executem, a como ela
se representa e a como publicadores usam as superfícies de descoberta, instalação e
confiança do ClawHub. Para estados de moderação e situação da conta, consulte
[Moderação e segurança da conta](/clawhub/moderation). Para reivindicações de direitos autorais ou outros direitos,
consulte [Solicitações de direitos de conteúdo](/pt-BR/clawhub/content-rights).

## Conteúdo permitido

ClawHub aceita conteúdo que seja útil, compreensível e publicado de boa-fé.

| Categoria                                        | Permitido quando                                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Produtividade de desenvolvimento                 | A listagem ajuda os usuários a criar, testar, migrar, depurar, documentar ou operar software.                                         |
| Fluxos de trabalho de UI, dados e automação      | O escopo é claro, as credenciais necessárias são explícitas, e ações arriscadas incluem revisão, simulação, prévia ou confirmação.    |
| Segurança defensiva, moderação e análise de abuso | A ferramenta é apresentada para revisão autorizada, preserva evidências e mantém claros os limites de aprovação humana.               |
| Fluxos de trabalho pessoais ou de equipe         | O fluxo de trabalho usa contas baseadas em consentimento, configuração transparente e permissões explícitas.                          |
| Catálogos mantidos                               | Cada listagem é distinta, útil, descrita com precisão e mantida de forma razoável.                                                    |

O contexto importa. O mesmo tema pode ser aceitável em um contexto defensivo restrito ou
baseado em consentimento e inaceitável quando empacotado como um fluxo de trabalho de abuso.

## Conteúdo proibido

ClawHub não hospeda conteúdo cujo objetivo principal seja abuso, engano, execução insegura
ou violação de direitos.

| Categoria                                                   | Não permitido                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso não autorizado ou bypass de segurança                | Bypass de autenticação, tomada de conta, abuso de limite de taxa, tomada de chamada ao vivo ou agente, roubo de sessão reutilizável ou aprovação automática de fluxos de pareamento para usuários não aprovados.                                                                                                     |
| Abuso de plataforma e evasão de banimento                   | Contas furtivas após banimentos, aquecimento ou cultivo de contas, engajamento falso, automação de várias contas, postagem em massa, bots de spam ou automação criada para evitar detecção.                                                                                                                          |
| Fraude, golpes e fluxos financeiros enganosos               | Certificados ou faturas falsos, fluxos de pagamento enganosos, abordagem para golpes, prova social falsa, fluxos de identidade sintética para fraude ou ferramentas de gasto/cobrança sem aprovação humana clara.                                                                                                   |
| Enriquecimento invasivo de privacidade ou vigilância        | Raspagem de contatos para spam, doxxing, perseguição, extração de leads combinada com abordagem não solicitada, monitoramento encoberto, correspondência biométrica não consensual ou uso de dados vazados ou dumps de violação.                                                                                   |
| Personificação não consensual ou manipulação de identidade  | Troca de rosto, gêmeos digitais, influenciadores clonados, personas falsas ou outras ferramentas usadas para personificar ou enganar.                                                                                                                                                                                |
| Conteúdo sexual explícito ou geração adulta com segurança desativada | Geração de imagem, vídeo ou conteúdo NSFW; wrappers de conteúdo adulto em torno de APIs de terceiros; ou listagens cujo objetivo principal seja conteúdo sexual explícito.                                                                                                                                         |
| Requisitos de execução ocultos, inseguros ou enganosos      | Comandos de instalação ofuscados, instaladores pipe-to-shell como conteúdo baixado executado com `sh` ou `bash` sem revisibilidade clara, requisitos de segredo ou chave privada não declarados, execução remota de `npx @latest` sem revisibilidade clara ou metadados que ocultam o que a listagem realmente precisa para executar. |
| Material que infringe direitos autorais ou viola direitos   | Republicar Skill, plugin, documentação, ativos de marca ou código proprietário de outra pessoa sem permissão; violar termos de licença; ou personificar o autor ou publicador original.                                                                                                                            |

## Comportamento proibido no marketplace

ClawHub também analisa como publicadores usam o marketplace. Não use o ClawHub para
manipular descoberta, métricas, sinais de confiança, sistemas de moderação ou a
atenção dos usuários.

Comportamentos proibidos no marketplace incluem:

- publicar em massa grandes números de listagens de baixo esforço, duplicadas, placeholder ou
  geradas por máquina que não parecem ter valor real para usuários
- inundar superfícies de busca ou categoria com Skills ou plugins quase idênticos
- publicar centenas de listagens com pouco ou nenhum uso, manutenção, clareza de origem
  ou diferenciação significativa
- inflar artificialmente instalações, downloads, estrelas ou outras métricas de
  engajamento por meio de automação, ciclos de auto-instalação, contas falsas, atividade
  coordenada, engajamento pago ou outro comportamento não orgânico
- criar ou alternar contas para evadir moderação, banimentos, limites de publicador ou
  revisão do marketplace
- enganar usuários sobre propriedade, origem, capacidades, postura de segurança,
  requisitos de instalação ou afiliação com outro projeto ou publicador
- enviar repetidamente conteúdo que já foi ocultado, removido ou bloqueado
  sem corrigir o problema subjacente

Publicação em alto volume não é automaticamente abuso. Catálogos grandes são aceitáveis
quando as listagens são significativamente diferentes, descritas com precisão, mantidas
e usadas por usuários reais. Catálogos grandes se tornam um problema de confiança e segurança quando
o volume vem acompanhado de listagens superficiais, duplicadas, enganosas, sem manutenção ou
promovidas artificialmente.

## Direitos de conteúdo

Se você acredita que conteúdo no ClawHub infringe seus direitos autorais ou outros direitos, use
[Solicitações de direitos de conteúdo](/pt-BR/clawhub/content-rights). Não use relatórios normais do marketplace
para reivindicações de direitos autorais ou direitos, a menos que a listagem também seja insegura,
maliciosa ou enganosa.

## Revisão e aplicação

ClawHub pode usar verificações automatizadas, sinais estatísticos de abuso, relatos de usuários e
revisão da equipe para identificar conteúdo inseguro ou comportamento de publicação abusivo. Um sinal
não comprova abuso por si só; ele ajuda o ClawHub a decidir o que precisa de revisão.

Podemos:

- ocultar, reter, remover, excluir de forma reversível ou, quando compatível com o tipo de recurso,
  excluir permanentemente listagens violadoras
- bloquear downloads ou instalações de lançamentos inseguros
- revogar tokens de API
- excluir de forma reversível conteúdo associado
- restringir acesso de publicação
- banir infratores reincidentes ou graves

Não garantimos aplicação com aviso prévio para abusos óbvios. Consulte
[Moderação e segurança da conta](/clawhub/moderation) para relatos, retenções de moderação,
listagens ocultas, banimentos e situação da conta.
