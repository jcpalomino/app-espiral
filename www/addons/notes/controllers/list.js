// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.addons.notes')

/**
 * Controller to handle notes.
 *
 * @module mm.addons.notes
 * @ngdoc controller
 * @name mmaNotesListCtrl
 */
.controller('mmaNotesListCtrl', function($scope, $stateParams, $mmUtil, $mmaNotes, $mmSite, $translate) {

    var courseid = $stateParams.courseid,
        type = $stateParams.type;

    $scope.courseid = courseid;
    $scope.type = type;
    $scope.selectedNotes = [];
    // Check if user can delete notes.
    var canDelete = $mmaNotes.canDeleteNotes();

    $translate('mma.notes.' + type + 'notes').then(function(string) {
        $scope.title = string;
    });

    function fetchNotes(refresh) {
        return $mmaNotes.getNotes(courseid, refresh).then(function(notes) {
            notes = notes[type + 'notes'];

            return $mmaNotes.getNotesUserData(notes, courseid).then(function(notes) {
                $scope.notes = notes;
            });

        }, function(message) {
            $mmUtil.showErrorModal(message);
        });
    }

    fetchNotes().then(function() {
        // Add log in Moodle.
        $mmSite.write('core_notes_view_notes', {
            courseid: courseid,
            userid: 0
        });
    })
    .finally(function() {
        $scope.notesLoaded = true;
    });

    $scope.refreshNotes = function() {
        fetchNotes(true).finally(function() {
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    /**
     * Add or remove a note from the current selection.
     *
     * @param  {Number} noteId The note Id.
     */
    $scope.selectNote = function(noteId) {
        if (!canDelete) {
            return;
        }

        var index = $scope.selectedNotes.indexOf(noteId);
        if (index !== -1) {
            $scope.selectedNotes.splice(index, 1);
        } else {
            $scope.selectedNotes.push(noteId);
        }
    };

    /**
     * Delete the selected notes.
     */
    $scope.deleteNotes = function() {

        var modal = $mmUtil.showModalLoading('mm.core.deleting', true);
        $mmaNotes.deleteNotes($scope.selectedNotes).then(function() {
            // Remove notes from list.
            var i = $scope.notes.length;
            while (i--){
                if ($scope.selectedNotes.indexOf($scope.notes[i].id) !== -1){
                    $scope.notes.splice(i, 1);
                }
            }
            // Clear the selected notes array.
            $scope.selectedNotes = [];
            // Re-fetch notes to update the cached data.
            $scope.refreshNotes();
        }).catch(function(error) {
            if (typeof error === 'string') {
                $mmUtil.showErrorModal(error);
            } else {
                $mmUtil.showErrorModal('mm.core.errorinvalidresponse', true);
            }
        }).finally(function() {
            modal.dismiss();
        });
    };
});
