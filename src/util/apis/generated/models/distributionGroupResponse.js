/*
 * Code generated by Microsoft (R) AutoRest Code Generator 0.17.0.0
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

'use strict';

/**
 * @class
 * Initializes a new instance of the DistributionGroupResponse class.
 * @constructor
 * @member {string} id The unique ID of the distribution group
 * 
 * @member {string} name The name of the distribution group used in URLs
 * 
 * @member {string} origin Indicates the origin source of the distribution
 * group, it can be mobile-center or hockeyapp for now. Possible values
 * include: 'mobile-center', 'hockeyapp'
 * 
 */
function DistributionGroupResponse() {
}

/**
 * Defines the metadata of DistributionGroupResponse
 *
 * @returns {object} metadata of DistributionGroupResponse
 *
 */
DistributionGroupResponse.prototype.mapper = function () {
  return {
    required: false,
    serializedName: 'DistributionGroupResponse',
    type: {
      name: 'Composite',
      className: 'DistributionGroupResponse',
      modelProperties: {
        id: {
          required: true,
          serializedName: 'id',
          type: {
            name: 'String'
          }
        },
        name: {
          required: true,
          serializedName: 'name',
          type: {
            name: 'String'
          }
        },
        origin: {
          required: true,
          serializedName: 'origin',
          type: {
            name: 'String'
          }
        }
      }
    }
  };
};

module.exports = DistributionGroupResponse;
