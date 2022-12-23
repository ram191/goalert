package swoinfo

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTable_InsertJSONRowsQuery(t *testing.T) {
	tbl := Table{
		name: "test",
		cols: []column{
			{ColColumnName: "id"},
			{ColColumnName: "foo"},
			{ColColumnName: "bar"},
		},
	}
	query := tbl.InsertJSONRowsQuery(false)
	assert.Equal(t, `insert into "test" select * from json_populate_recordset(null::"test", $1)`, query)
	query = tbl.InsertJSONRowsQuery(true)
	assert.Equal(t, `insert into "test" select * from json_populate_recordset(null::"test", $1) on conflict (id) do update set "foo" = excluded."foo", "bar" = excluded."bar" where "test".id = excluded.id`, query)
}
