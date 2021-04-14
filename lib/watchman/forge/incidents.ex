defmodule Watchman.Plural.Incidents do
  use Watchman.Plural.Base

  defmodule Mutation, do: defstruct [:createMessage]

  def create_message(incident_id, text) do
    create_message_mutation()
    |> Client.run(
      %{incidentId: incident_id, attributes: %{text: text}},
      %Mutation{}
    )
  end
end
