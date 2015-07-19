function OperationStats() {
}
OperationStats.prototype.to_return_count = 0;
OperationStats.prototype.to_skip_count = 0;
OperationStats.prototype.scanned_count = 0;
OperationStats.prototype.scanned_object_count = 0;
OperationStats.prototype.key_update_count = 0;
OperationStats.prototype.yield_count = 0;
OperationStats.prototype.returned_count = 0;
OperationStats.prototype.result_length = 0;
OperationStats.prototype.moved_count = 0;
OperationStats.prototype.deleted_count = 0;
OperationStats.prototype.updated_count = 0;
OperationStats.prototype.result_length = 0;
OperationStats.prototype.key_update_count = 0;
OperationStats.prototype.write_lock_time = 0;
OperationStats.prototype.read_lock_time = 0;

module.exports = OperationStats;
