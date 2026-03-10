<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddTreeColumnsToPdfs extends Migration
{
    public function up()
    {
        $this->forge->addColumn('pdfs', [
            'tree_file_id' => [
                'type' => 'VARCHAR',
                'constraint' => 64,
                'null' => true,
                'after' => 'processing_status',
            ],
            'tree_status' => [
                'type' => 'VARCHAR',
                'constraint' => 20,
                'default' => 'pending',
                'null' => true,
                'after' => 'tree_file_id',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('pdfs', 'tree_file_id');
        $this->forge->dropColumn('pdfs', 'tree_status');
    }
}
