defmodule Kube.Runbook do
  use Kazan.Model

  defmodule PathUpdate do
    use Kazan.Model

    defmodel "PathUpdate", "platform.plural.sh", "v1alpha1" do
      property :path,       "path", {:array, :string}
      property :value_from, "valueFrom", :string
    end
  end

  defmodule ConfigurationAction do
    use Kazan.Model
    alias Kube.Runbook.PathUpdate

    defmodel "ConfigurationAction", "platform.plural.sh", "v1alpha1" do
      property :updates, "updates", {:array, PathUpdate}
    end
  end

  defmodule Action do
    use Kazan.Model
    alias Kube.Runbook.ConfigurationAction

    defmodel "RunbookAction", "platform.plural.sh", "v1alpha1" do
      property :name,          "name",          :string
      property :action,        "action",        :string
      property :redirect_to,   "redirectTo",    :string
      property :configuration, "configuration", ConfigurationAction
    end
  end

  defmodule Kubernetes do
    use Kazan.Model

    defmodel "KubernetesDatasoource", "platform.plural.sh", "v1alpha1" do
      property :resource, "resource", :string
      property :name,     "name", :string
    end
  end

  defmodule Prometheus do
    use Kazan.Model

    defmodel "PrometheusDatasource", "platform.plural.sh", "v1alpha1" do
      property :query,  "query",  :string
      property :format, "format", :string
      property :legend, "legend", :string
    end
  end

  defmodule Datasource do
    use Kazan.Model
    alias Kube.Runbook.{Prometheus, Kubernetes}

    defmodel "RunbookDatasource", "platform.plural.sh", "v1alpha1" do
      property :name, "name", :string
      property :type, "type", :string
      property :prometheus, "prometheus", Prometheus
      property :kubernetes, "kubernetes", Kubernetes
    end
  end

  defmodule Spec do
    use Kazan.Model
    alias Kube.Runbook.{Datasource, Action}

    defmodel "RunbookSpec", "platform.plural.sh", "v1alpha1" do
      property :name,        "name",        :string
      property :description, "description", :string
      property :display,     "display",     :string
      property :datasources, "datasources", {:array, Datasource}
      property :actions,     "actions",     {:array, Action}
    end
  end

  defmodule AlertStatus do
    use Kazan.Model

    defmodel "RunbookAlertStatus", "platform.plural.sh", "v1alpha1" do
      property :name,        "name",        :string
      property :starts_at,   "startsAt",    :string
      property :fingerprint, "fingerprint", :string
      property :annotations, "annotations", :object
      property :labels,      "labels",      :object
    end
  end

  defmodule Status do
    use Kazan.Model
    alias Kube.Runbook.AlertStatus

    defmodel "RunbookStatus", "platform.plural.sh", "v1alpha1" do
      property :alerts, "alerts", {:array, AlertStatus}
    end
  end

  defmodel "Runbook", "platform.plural.sh", "v1alpha1" do
    property :spec,   "spec",   Spec
    property :status, "status", Status
  end
end

defmodule Kube.RunbookList do
  use Kazan.Model

  defmodellist "RunbookList",
               "platform.plural.sh",
               "v1alpha1",
               Kube.Runbook
end